use std::collections::HashMap;
use bevy_ecs::prelude::*;

use crate::rooms::enclosure::{object_types, EnclosureScanResult, RoomType, RoomValidationStatus};

/// Detailed breakdown of cell quality grading score (0 to 10).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellQualityBreakdown {
    pub is_valid: bool,
    pub area_tiles: u16,
    pub area_score: u8,
    pub has_exterior_window: bool,
    pub has_tv: bool,
    pub has_radio: bool,
    pub has_bookshelf: bool,
    pub has_desk_and_chair: bool,
    pub has_shower: bool,
    pub total_score: u8,
}

impl Default for CellQualityBreakdown {
    fn default() -> Self {
        Self {
            is_valid: false,
            area_tiles: 0,
            area_score: 0,
            has_exterior_window: false,
            has_tv: false,
            has_radio: false,
            has_bookshelf: false,
            has_desk_and_chair: false,
            has_shower: false,
            total_score: 0,
        }
    }
}

/// Bevy ECS component attached to validated cell entities storing the quality grade.
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct CellQualityScore {
    pub score: u8,
    pub breakdown: CellQualityBreakdown,
}

/// Evaluates a cell's quality grade based on validity, square meterage, and luxury amenities.
///
/// Scoring Rules:
/// - Base valid cell (Bed, Toilet, enclosed, min 6m²): 1 point
/// - Area >= 9m² (e.g. 3x3): +1 point
/// - Area >= 16m² (e.g. 4x4): +2 points (replaces the 9m² bonus)
/// - Window with outdoor sightline: +1 point
/// - Television (TV): +1 point
/// - Radio: +1 point
/// - Bookshelf: +1 point
/// - Desk AND Chair: +1 point
/// - In-cell Shower: +1 point
///
/// The total grade is clamped between 0 and 10.
pub fn evaluate_cell_quality(
    is_valid_cell: bool,
    area_tiles: u16,
    placed_objects: &HashMap<u16, u16>,
    has_exterior_window: bool,
) -> CellQualityBreakdown {
    if !is_valid_cell {
        return CellQualityBreakdown {
            is_valid: false,
            area_tiles,
            ..Default::default()
        };
    }

    let mut score = 1u8; // Base valid cell = 1

    // Area bonuses
    let area_score = if area_tiles >= 16 {
        score += 2;
        2
    } else if area_tiles >= 9 {
        score += 1;
        1
    } else {
        0
    };

    // Window bonus
    let window_present = has_exterior_window
        || placed_objects.get(&object_types::WINDOW).copied().unwrap_or(0) > 0;
    if window_present {
        score += 1;
    }

    // Television bonus
    let has_tv = placed_objects.get(&object_types::TV).copied().unwrap_or(0) > 0;
    if has_tv {
        score += 1;
    }

    // Radio bonus
    let has_radio = placed_objects.get(&object_types::RADIO).copied().unwrap_or(0) > 0;
    if has_radio {
        score += 1;
    }

    // Bookshelf bonus
    let has_bookshelf = placed_objects.get(&object_types::BOOKSHELF).copied().unwrap_or(0) > 0;
    if has_bookshelf {
        score += 1;
    }

    // Desk AND Chair bonus
    let has_desk = placed_objects.get(&object_types::DESK).copied().unwrap_or(0) > 0;
    let has_chair = placed_objects.get(&object_types::CHAIR).copied().unwrap_or(0) > 0;
    let has_desk_and_chair = has_desk && has_chair;
    if has_desk_and_chair {
        score += 1;
    }

    // In-cell Shower bonus
    let has_shower = placed_objects.get(&object_types::SHOWER).copied().unwrap_or(0) > 0;
    if has_shower {
        score += 1;
    }

    let total_score = score.min(10);

    CellQualityBreakdown {
        is_valid: true,
        area_tiles,
        area_score,
        has_exterior_window: window_present,
        has_tv,
        has_radio,
        has_bookshelf,
        has_desk_and_chair,
        has_shower,
        total_score,
    }
}

/// Evaluates cell quality from a room scan result and validation status.
pub fn evaluate_cell_quality_from_scan(
    room_type: RoomType,
    validation: &RoomValidationStatus,
    scan: &EnclosureScanResult,
    has_exterior_window: bool,
) -> CellQualityBreakdown {
    if room_type != RoomType::Cell || *validation != RoomValidationStatus::Valid {
        return CellQualityBreakdown {
            is_valid: false,
            area_tiles: scan.tiles.len() as u16,
            ..Default::default()
        };
    }

    evaluate_cell_quality(
        true,
        scan.tiles.len() as u16,
        &scan.placed_objects,
        has_exterior_window,
    )
}

/// Bevy ECS system that updates cell quality components.
pub fn evaluate_cell_grade_system(
    mut query: Query<(&mut CellQualityScore, &RoomType, &RoomValidationStatus, &EnclosureScanResult)>,
) {
    for (mut quality_comp, room_type, validation, scan) in query.iter_mut() {
        let breakdown = evaluate_cell_quality_from_scan(*room_type, validation, scan, false);
        quality_comp.score = breakdown.total_score;
        quality_comp.breakdown = breakdown;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minimal_cell_scores_grade_1() {
        // Minimal 2x3 cell (6 tiles) with Bed + Toilet
        let mut objects = HashMap::new();
        objects.insert(object_types::BED, 1);
        objects.insert(object_types::TOILET, 1);

        let breakdown = evaluate_cell_quality(true, 6, &objects, false);
        assert_eq!(breakdown.total_score, 1);
        assert_eq!(breakdown.area_score, 0);
        assert!(breakdown.is_valid);
    }

    #[test]
    fn test_spacious_cell_with_luxuries_scores_grade_7() {
        // 4x4 cell (16m²) with Window, Bookshelf, TV, and Shower
        let mut objects = HashMap::new();
        objects.insert(object_types::BED, 1);
        objects.insert(object_types::TOILET, 1);
        objects.insert(object_types::WINDOW, 1);
        objects.insert(object_types::BOOKSHELF, 1);
        objects.insert(object_types::TV, 1);
        objects.insert(object_types::SHOWER, 1);

        // Expected: Base (1) + Area>=16 (2) + Window (1) + Bookshelf (1) + TV (1) + Shower (1) = 7
        let breakdown = evaluate_cell_quality(true, 16, &objects, false);
        assert_eq!(breakdown.total_score, 7);
        assert_eq!(breakdown.area_score, 2);
        assert!(breakdown.has_exterior_window);
        assert!(breakdown.has_bookshelf);
        assert!(breakdown.has_tv);
        assert!(breakdown.has_shower);
        assert!(!breakdown.has_radio);
        assert!(!breakdown.has_desk_and_chair);
    }

    #[test]
    fn test_desk_and_chair_synergy() {
        let mut objects = HashMap::new();
        objects.insert(object_types::BED, 1);
        objects.insert(object_types::TOILET, 1);
        objects.insert(object_types::DESK, 1); // Only desk, no chair

        let b1 = evaluate_cell_quality(true, 6, &objects, false);
        assert_eq!(b1.total_score, 1);
        assert!(!b1.has_desk_and_chair);

        // Add chair -> synergy unlocked
        objects.insert(object_types::CHAIR, 1);
        let b2 = evaluate_cell_quality(true, 6, &objects, false);
        assert_eq!(b2.total_score, 2);
        assert!(b2.has_desk_and_chair);
    }

    #[test]
    fn test_maximum_luxury_cell_capped_at_10() {
        // Area 25m² (+2), Window (+1), TV (+1), Radio (+1), Bookshelf (+1), Desk+Chair (+1), Shower (+1), Base (+1) = 9
        let mut objects = HashMap::new();
        objects.insert(object_types::BED, 1);
        objects.insert(object_types::TOILET, 1);
        objects.insert(object_types::TV, 1);
        objects.insert(object_types::RADIO, 1);
        objects.insert(object_types::BOOKSHELF, 1);
        objects.insert(object_types::DESK, 1);
        objects.insert(object_types::CHAIR, 1);
        objects.insert(object_types::SHOWER, 1);

        let breakdown = evaluate_cell_quality(true, 25, &objects, true);
        assert_eq!(breakdown.total_score, 9);
    }

    #[test]
    fn test_invalid_cell_scores_zero() {
        let mut objects = HashMap::new();
        objects.insert(object_types::TV, 1);
        objects.insert(object_types::SHOWER, 1);

        let breakdown = evaluate_cell_quality(false, 16, &objects, true);
        assert_eq!(breakdown.total_score, 0);
        assert!(!breakdown.is_valid);
    }
}
