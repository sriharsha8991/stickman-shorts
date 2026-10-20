import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// In sandboxed cloud workspaces Remotion can't download its headless browser: setup.sh points
// REMOTION_BROWSER at a local Chromium. On a normal machine leave it unset.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
  Config.setChromeMode("chrome-for-testing");
}
