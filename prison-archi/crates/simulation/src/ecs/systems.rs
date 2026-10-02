use bevy_ecs::prelude::*;

use super::components::{Position, Renderable, SimulationEntityId, Velocity};
use super::resources::SimTimeResource;
use crate::memory::layout::RenderEntityPacked;

/// Stage 5: Moves entities along velocity vectors
pub fn physics_movement_system(
    time: Res<SimTimeResource>,
    mut query: Query<(&mut Position, &Velocity, Option<&mut Renderable>)>,
) {
    let dt = time.tick_delta_seconds;

    for (mut pos, vel, maybe_renderable) in query.iter_mut() {
        let speed = if vel.speed_multiplier <= 0.0 {
            1.0
        } else {
            vel.speed_multiplier
        };

        pos.x += vel.dx * speed * dt;
        pos.y += vel.dy * speed * dt;

        if let Some(mut renderable) = maybe_renderable {
            // Update heading rotation if moving
            if vel.dx.abs() > 0.001 || vel.dy.abs() > 0.001 {
                renderable.rotation = vel.dy.atan2(vel.dx);
            }
        }
    }
}

/// Stage 8: Advances simulation clock after all systems finish
pub fn advance_time_system(mut time: ResMut<SimTimeResource>) {
    time.tick += 1;
    time.elapsed_seconds += time.tick_delta_seconds;
}

/// Helper function to serialize all active ECS entities into the 32-byte RenderEntityPacked format
pub fn serialize_render_entities(
    world: &mut World,
    output_slice: &mut [RenderEntityPacked],
) -> usize {
    let mut query = world.query::<(Entity, &Position, Option<&Renderable>, Option<&SimulationEntityId>)>();
    let mut count = 0;

    for (entity, pos, maybe_renderable, maybe_id) in query.iter(world) {
        if count >= output_slice.len() {
            break;
        }

        let entity_id = maybe_id.map(|id| id.0).unwrap_or(entity.index() as u32);
        let (sprite_index, anim_frame, status_flags, tint_rgba, rotation) = match maybe_renderable {
            Some(r) => (r.sprite_index, r.anim_frame, r.status_flags, r.tint_rgba, r.rotation),
            None => (0, 0, 0, 0xFFFFFFFF, 0.0),
        };

        output_slice[count] = RenderEntityPacked {
            entity_id,
            pos_x: pos.x,
            pos_y: pos.y,
            rotation,
            sprite_index,
            anim_frame,
            status_flags,
            tint_rgba,
            elevation_layer: pos.layer,
            _padding: [0; 7],
        };

        count += 1;
    }

    count
}
