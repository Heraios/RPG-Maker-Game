# Icon index (Iconset.png)

`img/system/Iconset.png` is built from the sets in `img/system/RPG_Maker`, stacked in the order below, 16 icons per row,
with each set's blank rows dropped.
In the editor, pick icons from the icon picker as usual; this table says where each set starts.

| Set (file in `img/system/RPG_Maker`) | Icon numbers |
|---|---|
| Icon sheet (32x32) | 16–591 |
| Spells (32x32) | 592–911 |
| Colour variations (32x32) | 912–1151 |
| Fishing set (32x32) | 1152–1279 |
| Minecraft set (32x32) | 1280–1679 |

Each row of a set keeps its own row here (sets 10 or 11 icons wide are padded to 16 with blanks), so
icons that belong together still line up. Row 0 is left blank (RPG Maker treats icon 0 as "no icon").

To add a set later, put it in `img/system/RPG_Maker` and ask for the Iconset to be rebuilt with it added at the end,
so the icons already in use keep their numbers.
