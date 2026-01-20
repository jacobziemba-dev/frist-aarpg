class_name State_Attack extends State

@export var attack_duration: float = 0.4
@export var attack_range: float = 30.0

@onready var idle: State = $"../Idle"
@onready var walk: State = $"../Walk"
@onready var hitbox: Area2D = $"../../AttackHitbox"

var timer: float = 0.0
var attack_direction: Vector2 = Vector2.ZERO


# what happens when the player enters this state?
func Enter() -> void:
	attack_direction = player.cardinal_direction
	timer = 0.0
	player.UpdateAnimation("attack")
	player.velocity = Vector2.ZERO
	position_hitbox()
	hitbox.monitoring = true

	if not hitbox.area_entered.is_connected(_on_hit):
		hitbox.area_entered.connect(_on_hit)


# what happens when the player exits this state?
func Exit() -> void:
	hitbox.monitoring = false


# what happens during the _process update in this state?
func Process(delta: float) -> State:
	timer += delta
	if timer >= attack_duration:
		if player.direction != Vector2.ZERO:
			return walk
		else:
			return idle
	return null


# what happens during the _physics_process update in this state?
func Physics(_delta: float) -> State:
	return null


# what happens with input events in this state?
func HandleInput(_event: InputEvent) -> State:
	return null


func position_hitbox() -> void:
	var offset: Vector2 = attack_direction * attack_range
	hitbox.position = offset


func _on_hit(area: Area2D) -> void:
	if area.is_in_group("enemy_hurtbox"):
		var enemy = area.get_parent()
		if enemy.has_method("take_damage"):
			enemy.take_damage(10, attack_direction)
