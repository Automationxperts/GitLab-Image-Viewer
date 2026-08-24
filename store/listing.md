# Chrome Web Store listing

Copy these fields into the Developer Dashboard (https://chrome.google.com/webstore/devconsole).

## Package

`gitlab-image-viewer-1.0.0.zip` (in the GitHub release, or build it by zipping the contents of `extension/`).

## Store listing

**Name** (from manifest): GitLab Image Viewer - Thumbnail Gallery for Repos

**Summary** (from manifest, max 132 chars):
See every image in a GitLab folder as a thumbnail grid. Adjustable size, images per row, and a full-size lightbox.

**Category:** Developer Tools
**Language:** English

**Description:**

Stop clicking image files one by one on GitLab.

GitLab Image Viewer turns any GitLab folder into a thumbnail gallery. Open a folder of sprites, icons, screenshots, textures, UI mockups or dataset samples and every image appears as a grid above the file list. Works on gitlab.com and on self-hosted GitLab.

FEATURES
• Thumbnail grid for PNG, JPG, GIF, SVG, WebP, AVIF, BMP and ICO files
• Thumbnail size slider from 48 px to 512 px
• Images per row: pick an exact number or let it fit automatically
• Full-size lightbox with image dimensions; arrow keys to browse, Esc to close
• Pixel art is scaled up sharply, not blurred
• Filter as you type to find one image in a large folder
• Show or hide file names, or hide GitLab's file list entirely
• Works on private projects through your normal GitLab session
• Self-hosted GitLab: add your instance on the settings page
• Matches GitLab's light and dark themes
• Lazy loading keeps large folders fast
• Ctrl-click or middle-click a thumbnail to open the file page

SELF-HOSTED GITLAB
gitlab.com works immediately. For your own instance, open the extension settings, add its address (for example https://gitlab.example.com, or a subpath such as https://example.com/gitlab), and approve the permission prompt for that origin. The extension requests access to that one origin only.

PRIVACY
No analytics, no tracking, no servers. The extension stores only your grid settings and the self-hosted instances you add, in your browser. Images are loaded from the GitLab instance you are viewing, exactly as GitLab loads them.

Open source (MIT): https://github.com/AutomationXpert/Gitlab-Image-Viewer
Website: https://AutomationXpert.github.io/Gitlab-Image-Viewer/

Not affiliated with GitLab, Inc. GitLab is a trademark of GitLab Inc.

## Graphics

- Store icon 128×128: `store/store-icon-128.png`
- Screenshots 1280×800: `store/screenshot-1-grid.png`, `store/screenshot-2-perrow.png`, `store/screenshot-3-lightbox.png`, `store/screenshot-4-options.png`
- Small promo tile 440×280: `store/promo-small-440x280.png`
- Marquee promo tile 1400×560: `store/promo-marquee-1400x560.png`

## Additional fields

- **Official URL / Homepage:** https://AutomationXpert.github.io/Gitlab-Image-Viewer/
- **Support URL:** https://github.com/AutomationXpert/Gitlab-Image-Viewer/issues

## Privacy practices tab

- **Single purpose:** Shows the images in a GitLab folder as a thumbnail grid with a lightbox.
- **Permission justification, storage:** Saves the user's grid settings (thumbnail size, images per row, show names, hide file list) and the self-hosted GitLab instances they enable.
- **Permission justification, scripting:** Registers the content script that adds the grid on a self-hosted GitLab origin the user has explicitly approved.
- **Permission justification, host access (https://gitlab.com/*):** The content script adds the thumbnail grid to GitLab folder pages and reads the image file links on that page.
- **Permission justification, optional host access:** Used only for self-hosted GitLab instances the user adds on the settings page. Access is requested per origin at the moment the user confirms the instance, and is never requested for any other site.
- **Remote code:** No, the extension does not use remote code.
- **Data usage:** Collects none of the listed data types. Tick the three certification boxes.
- **Privacy policy URL:** https://AutomationXpert.github.io/Gitlab-Image-Viewer/privacy.html

## Distribution

Public, all regions, free.
