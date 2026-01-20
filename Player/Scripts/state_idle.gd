class_name State_Idle extends State


@onready var walk: State = $"../Walk"
@onready var attack: State = $"../Attack"



# what happens when the player enters this state?
func Enter() -> void:
	player.UpdateAnimation("idle")
	pass


# what happens when the player exits this state?
func Exit() -> void:
	pass


# what happens during the _process update in this state?
func Process(_delta: float) -> State:
	if player.direction != Vector2.ZERO:
		return walk
	player.velocity = Vector2.ZERO
	return null


# what happens during the _physics_process update in this state?
func Physics(_delta: float) -> State:
	return null


# what happens with input events in this state?
func HandleInput(event: InputEvent) -> State:
	if event.is_action_pressed("attack"):
		return attack
	return null




