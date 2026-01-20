#!/usr/bin/env node

/**
 * Godot MCP Bridge
 * 
 * This script bridges Cursor's MCP stdio protocol to the Godot MCP WebSocket server.
 * It translates MCP requests to Godot's custom protocol format.
 */

const WebSocket = require('ws');
const readline = require('readline');

const GODOT_WS_URL = process.env.GODOT_WS_URL || 'ws://localhost:6550';
const GODOT_WS_RECONNECT_DELAY = 2000;

let ws = null;
let pendingRequests = new Map();
let requestIdCounter = 0;
let isConnected = false;

// Setup readline for stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Connect to Godot WebSocket server
function connectToGodot() {
  console.error(`[Godot MCP Bridge] Connecting to ${GODOT_WS_URL}...`);
  
  ws = new WebSocket(GODOT_WS_URL);
  
  ws.on('open', () => {
    isConnected = true;
    console.error('[Godot MCP Bridge] Connected to Godot WebSocket server');
    
    // Send handshake
    sendGodotCommand('mcp_handshake', {
      server_version: '1.0.0'
    }, (response) => {
      if (response.status === 'success') {
        console.error(`[Godot MCP Bridge] Handshake successful. Godot version: ${response.data.godot_version}, Addon version: ${response.data.addon_version}`);
      }
    });
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleGodotResponse(message);
    } catch (error) {
      console.error('[Godot MCP Bridge] Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('[Godot MCP Bridge] WebSocket error:', error.message);
    isConnected = false;
  });
  
  ws.on('close', () => {
    console.error('[Godot MCP Bridge] WebSocket connection closed. Reconnecting...');
    isConnected = false;
    setTimeout(connectToGodot, GODOT_WS_RECONNECT_DELAY);
  });
}

// Send command to Godot
function sendGodotCommand(command, params, callback) {
  if (!isConnected || !ws || ws.readyState !== WebSocket.OPEN) {
    if (callback) {
      callback({
        status: 'error',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to Godot WebSocket server'
        }
      });
    }
    return;
  }
  
  const id = String(++requestIdCounter);
  const message = {
    id: id,
    command: command,
    params: params || {}
  };
  
  if (callback) {
    pendingRequests.set(id, callback);
  }
  
  ws.send(JSON.stringify(message));
}

// Handle response from Godot
function handleGodotResponse(message) {
  const id = message.id;
  const callback = pendingRequests.get(id);
  
  if (callback) {
    pendingRequests.delete(id);
    callback(message);
  }
}

// Handle MCP protocol messages from Cursor
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    handleMCPMessage(message);
  } catch (error) {
    console.error('[Godot MCP Bridge] Error parsing MCP message:', error);
    sendMCPError(null, 'PARSE_ERROR', 'Invalid JSON: ' + error.message);
  }
});

// Handle MCP protocol messages
function handleMCPMessage(message) {
  const { jsonrpc, id, method, params } = message;
  
  if (jsonrpc !== '2.0') {
    sendMCPError(id, 'INVALID_REQUEST', 'Invalid JSON-RPC version');
    return;
  }
  
  // Map MCP methods to Godot commands
  if (method === 'initialize') {
    sendMCPResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: {
        name: 'godot-mcp-bridge',
        version: '1.0.0'
      }
    });
    return;
  }
  
  if (method === 'tools/list') {
    // List available Godot commands as MCP tools
    sendMCPResponse(id, {
      tools: [
        {
          name: 'get_project_info',
          description: 'Get project information',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_project_settings',
          description: 'Get project settings',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Settings category (e.g., "input")'
              }
            }
          }
        },
        {
          name: 'get_node_properties',
          description: 'Get properties of a node',
          inputSchema: {
            type: 'object',
            properties: {
              node_path: {
                type: 'string',
                description: 'Path to the node'
              }
            },
            required: ['node_path']
          }
        },
        {
          name: 'find_nodes',
          description: 'Find nodes in the scene',
          inputSchema: {
            type: 'object',
            properties: {
              name_pattern: {
                type: 'string',
                description: 'Name pattern to search for'
              },
              type: {
                type: 'string',
                description: 'Node type to filter by'
              }
            }
          }
        }
        // Add more tools as needed
      ]
    });
    return;
  }
  
  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    
    sendGodotCommand(name, args || {}, (response) => {
      if (response.status === 'success') {
        sendMCPResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        });
      } else {
        sendMCPError(id, response.error?.code || 'GODOT_ERROR', response.error?.message || 'Unknown error');
      }
    });
    return;
  }
  
  // Handle other MCP methods
  if (method === 'ping') {
    sendMCPResponse(id, {});
    return;
  }
  
  sendMCPError(id, 'METHOD_NOT_FOUND', `Unknown method: ${method}`);
}

// Send MCP response
function sendMCPResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
  console.log(JSON.stringify(response));
}

// Send MCP error
function sendMCPError(id, code, message) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
  console.log(JSON.stringify(response));
}

// Start connection
connectToGodot();

// Handle process termination
process.on('SIGINT', () => {
  console.error('[Godot MCP Bridge] Shutting down...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Godot MCP Bridge] Shutting down...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});
