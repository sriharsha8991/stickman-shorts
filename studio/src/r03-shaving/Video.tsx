import React from "react";
import { RealCheck } from "../shared/realcheck";
import { SPEC } from "./spec";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

export const DURATION = VOICE_FRAMES;
export const Video: React.FC = () => <RealCheck spec={SPEC} cues={VOICE_CUES} frames={VOICE_FRAMES} mouth={mouthAt} />;
