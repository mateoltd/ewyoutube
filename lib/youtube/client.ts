import { Innertube, Platform } from "youtubei.js";
import evaluate from "./evaluate";

let innertubeInstance: Innertube | null = null;
let platformPatched = false;

/**
 * Patch the Platform shim with our custom JS evaluator.
 * Required for deciphering YouTube stream URLs.
 */
function patchPlatform() {
  if (platformPatched) return;
  Platform.load({ ...Platform.shim, eval: evaluate });
  platformPatched = true;
}

export async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    patchPlatform();
    innertubeInstance = await Innertube.create({
      retrieve_player: true,
    });
  }
  return innertubeInstance;
}

export async function resetInnertube(): Promise<Innertube> {
  innertubeInstance = null;
  return getInnertube();
}
