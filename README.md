# Groveheart

Website of the Kingdom of Groveheart, a village kingdom on the CivMC Minecraft server.

Plain HTML, CSS and JavaScript, no build step. Open `index.html` through any static web server
(for example `python3 -m http.server`) to preview it locally.

## Updating content

- **Shops:** add entries to `assets/data/shops.json`
  ```json
  [{ "name": "Oak & Co", "owner": "Steve", "location": "-5900 70 5580", "icon": "diamond",
     "items": [{ "item": "Oak logs (stack)", "price": "1 D" }] }]
  ```
  `icon` is the name of a texture in `assets/items`.
- **Gallery:** put screenshots in `assets/gallery/` and list them in `assets/data/gallery.json`
  ```json
  [{ "src": "assets/gallery/capital.jpg", "caption": "The capital at sunset" }]
  ```

## Credits

- Fonts: [Monocraft](https://github.com/IdreesInc/Monocraft) and [Inter](https://github.com/rsms/inter), both SIL Open Font License.
- Minecraft textures belong to Mojang. This is a fan-made community site and is not affiliated with Mojang or Microsoft.
