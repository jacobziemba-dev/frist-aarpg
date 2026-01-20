# Godot MCP Setup Guide

This guide will help you set up the Godot MCP (Model Context Protocol) server to work with Cursor.

## Prerequisites

1. **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
2. **Godot Editor** (version 4.5 or higher) with the MCP plugin enabled
3. **Cursor** with MCP support

## Step 1: Install Dependencies

Open a terminal in your project root and run:

```bash
npm install
```

This will install the `ws` (WebSocket) package needed for the bridge.

## Step 2: Ensure Godot Plugin is Enabled

1. Open your project in Godot Editor
2. Go to **Project → Project Settings → Plugins**
3. Make sure the **Godot MCP** plugin is enabled
4. The plugin will automatically start a WebSocket server on port **6550**

You should see an "MCP" panel at the bottom of the Godot editor showing the connection status.

## Step 3: Configure Cursor MCP

Cursor's MCP configuration can be set in two places:

### Option 1: Project-specific (Recommended)
Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": [
        "C:\\Dev\\GODOT_GAME_PROJECTS\\frist-aarpg\\godot-mcp-bridge.js"
      ],
      "env": {
        "GODOT_WS_URL": "ws://localhost:6550"
      }
    }
  }
}
```

**Note**: The configuration file has already been created at `.cursor/mcp.json` in your project.

### Option 2: Global configuration
Alternatively, you can configure it globally at:
- **Windows**: `%USERPROFILE%\.cursor\mcp.json`
- **macOS/Linux**: `~/.cursor/mcp.json`

**Important**: Replace the path in `args` with the absolute path to your `godot-mcp-bridge.js` file if it's different.

## Step 4: Restart Cursor

After configuring the MCP server, restart Cursor completely for the changes to take effect.

## Step 5: Verify Connection

1. Make sure Godot Editor is running with your project open
2. Check the MCP status panel at the bottom of the Godot editor - it should show "Waiting for connection..."
3. In Cursor, the MCP server should connect automatically
4. The Godot status panel should change to "Connected" when Cursor connects

## Troubleshooting

### Bridge can't connect to Godot

- Ensure Godot Editor is running with the project open
- Check that the plugin is enabled in Project Settings
- Verify the WebSocket server is listening on port 6550 (check Godot's output panel)
- Try changing the port in `websocket_server.gd` if 6550 is in use

### Cursor can't find the bridge

- Verify the path in the MCP configuration is correct and uses absolute paths
- Ensure Node.js is installed and in your PATH
- Check that `npm install` completed successfully
- Try running the bridge manually: `node godot-mcp-bridge.js` to see error messages

### Connection drops

- The bridge will automatically reconnect if the connection is lost
- Make sure Godot Editor stays open while using Cursor
- Check for firewall or antivirus blocking the connection

## Available Commands

Once connected, you can use various Godot commands through Cursor:

- `get_project_info` - Get project information
- `get_project_settings` - Get project settings
- `get_node_properties` - Get node properties
- `find_nodes` - Find nodes in the scene
- And many more (see the command files in `addons/godot_mcp/commands/`)

## Notes

- The bridge translates between Cursor's MCP protocol and Godot's custom WebSocket protocol
- Only one client can connect to the Godot WebSocket server at a time
- The bridge will automatically reconnect if the connection is lost
- All communication is logged to stderr for debugging
