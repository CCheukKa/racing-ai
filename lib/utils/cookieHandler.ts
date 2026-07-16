import Cookies from 'js-cookie';
import type { SerialisedInputLayerOptions } from '../components/neuralNetwork';
import type { SerialisedNaturalSelectionOptions } from '../components/naturalSelection';
import type { SupportedLanguage } from '../translation';

type Cookie = {
    probeAngles?: number[];
    inputLayerOptions?: SerialisedInputLayerOptions;
    hiddenLayerSizes?: number[];
    naturalSelectionOptions?: SerialisedNaturalSelectionOptions;
    targetTPS?: number;
    uiLanguage?: SupportedLanguage;
};

const COOKIE_ROOT_NAME = 'cck-wtf-racing-ai';
export class CookieHandler {
    static cookie: Cookie | null = null;

    static init() {
        try { this.cookie = JSON.parse(Cookies.get(COOKIE_ROOT_NAME) ?? "") as Cookie; } catch (e) { console.log(e); }
        if (this.cookie) {
            console.log('Cookie fetched:', this.cookie);
        } else {
            console.log('No cookie');
            this.cookie = {};
        }
    }
    static updateCookie() {
        Cookies.set(COOKIE_ROOT_NAME, JSON.stringify(this.cookie));
    }
}