// WGSL Instanced Quad Sprite Shader for Prison Architect Web
// Handles camera view-projection, sprite atlas sampling, instanced quad generation, and color tinting.

struct CameraUniforms {
    view_proj: mat4x4<f32>,
    camera_pos: vec2<f32>,
    zoom: f32,
    base_tile_size: f32,
};

@group(0) @binding(0)
var<uniform> camera: CameraUniforms;

@group(0) @binding(1)
var texture_sampler: sampler;

@group(0) @binding(2)
var sprite_texture: texture_2d<f32>;

// Unit quad vertices (2 triangles = 6 vertices)
const QUAD_VERTICES = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0),
);

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) world_pos: vec2<f32>,
    @location(3) @interpolate(flat) flags: u32,
};

@vertex
fn vs_main(
    @builtin(vertex_index) vertex_id: u32,
    @location(0) world_pos: vec2<f32>,
    @location(1) scale: vec2<f32>,
    @location(2) uv_rect: vec4<f32>,
    @location(3) tint_color: vec4<f32>,
    @location(4) flags: u32,
) -> VertexOutput {
    var out: VertexOutput;
    let local_uv = QUAD_VERTICES[vertex_id];
    let local_pos = local_uv * scale;
    let final_world = world_pos + local_pos;

    out.clip_position = camera.view_proj * vec4<f32>(final_world, 0.0, 1.0);
    out.uv = vec2<f32>(
        mix(uv_rect.x, uv_rect.z, local_uv.x),
        mix(uv_rect.y, uv_rect.w, local_uv.y)
    );
    out.color = tint_color;
    out.world_pos = final_world;
    out.flags = flags;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let tex_sample = textureSample(sprite_texture, texture_sampler, in.uv);
    let final_color = tex_sample * in.color;
    if (final_color.a < 0.01) {
        discard;
    }
    return final_color;
}
