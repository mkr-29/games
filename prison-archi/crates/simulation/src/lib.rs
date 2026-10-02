pub mod memory;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_simulation() -> Result<String, JsValue> {
    // Better panic messages in browser console
    console_error_panic_hook::set_once();

    web_sys::console::log_1(&"[Simulation Core] Wasm Engine v0.1.0 Online".into());
    Ok("PRISON_SIMULATION_READY".to_string())
}

#[wasm_bindgen]
pub fn wasm_ping(message: &str) -> String {
    format!("[Wasm Pong]: {}", message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wasm_ping() {
        let response = wasm_ping("Hello Prison Architect");
        assert_eq!(response, "[Wasm Pong]: Hello Prison Architect");
    }
}
