import unittest

from runtime.pet_geometry import interaction_for_point


class InteractionZoneTests(unittest.TestCase):
    def test_upper_band_is_head_pat(self) -> None:
        self.assertEqual(interaction_for_point(120, 40, 240, 352), "head_pat")
        self.assertEqual(interaction_for_point(5, 150, 240, 352), "head_pat")

    def test_outer_sides_below_head_are_wings(self) -> None:
        self.assertEqual(interaction_for_point(20, 250, 240, 352), "wings")
        self.assertEqual(interaction_for_point(225, 250, 240, 352), "wings")

    def test_center_below_head_is_poke(self) -> None:
        self.assertEqual(interaction_for_point(120, 250, 240, 352), "poke")

    def test_boundaries(self) -> None:
        # 0.45 * 352 = 158.4; 0.22 * 240 = 52.8; 0.78 * 240 = 187.2
        self.assertEqual(interaction_for_point(120, 158, 240, 352), "head_pat")
        self.assertEqual(interaction_for_point(120, 159, 240, 352), "poke")
        self.assertEqual(interaction_for_point(52, 200, 240, 352), "wings")
        self.assertEqual(interaction_for_point(53, 200, 240, 352), "poke")
        self.assertEqual(interaction_for_point(188, 200, 240, 352), "wings")

    def test_negative_coordinates_are_clamped(self) -> None:
        self.assertEqual(interaction_for_point(-10, -10, 240, 352), "head_pat")


if __name__ == "__main__":
    unittest.main()
