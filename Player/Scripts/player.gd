# Player.gd
# This script defines the core functionality for the Player character.
# Handles movement, state, direction, and animation transitions.

class_name Player extends CharacterBody2D

# Cardinal direction of movement (can be Vector2.UP, DOWN, LEFT, RIGHT)
var cardinal_direction: Vector2 = Vector2.DOWN
# Current input direction
var direction: Vector2 = Vector2.ZERO




# Reference node 
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var sprite: Sprite2D = $Sprite2D
@onready var state_machine : PlayerStateMachine= $StateMachine





# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	state_machine.Initialize(self)
	pass # You can set up player-specific logic here.
0
# Called every frame. Handles input, movement, state changes, and animation updates.
# 'delta' is the elapsed time since the previous frame.
func _process(_delta: float) -> void:
	# Calculate the direction vector based on input actions
	# direction.x = Input.get_action_strength("right") - Input.get_action_strength("left")
	# direction.y = Input.get_action_strength("down") - Input.get_action_strength("up")
	direction = Vector2(
		Input.get_axis("left", "right"),
		Input.get_axis("up", "down")
	).normalized()

		

func _physics_process(delta):
	move_and_slide()


# Determines the primary (cardinal) direction based on input direction.
# Returns true if changed since last update.
func SetDirection() -> bool:
	var new_dir: Vector2 = cardinal_direction # Start with current direction
	
	# If no movement input, direction hasn't changed
	if direction == Vector2.ZERO:
		return false

	# Horizontal movement takes priority if present
	if direction.y == 0:
		new_dir = Vector2.LEFT if direction.x < 0 else Vector2.RIGHT
	elif direction.x == 0:
		new_dir = Vector2.UP if direction.y < 0 else Vector2.DOWN

	# No change in cardinal direction
	if new_dir == cardinal_direction:
		return false

	# Apply the new direction, and flip the sprite for left/right
	cardinal_direction = new_dir
	sprite.scale.x = -1 if cardinal_direction == Vector2.LEFT else 1

	return true
	
	


# Updates the animation based on state and direction.
func UpdateAnimation(state: String) -> void:
	animation_player.play(state + "_" + AnimDirection())
	pass

# Returns animation direction string based on cardinal direction.
# Used to pick appropriate animation suffix ("down", "up", or "side").
func AnimDirection() -> String:
	if cardinal_direction == Vector2.DOWN:
		return "down"
	elif cardinal_direction == Vector2.UP:
		return "up"
	else:
		return "side"
