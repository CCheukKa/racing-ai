import { UI } from '@lib/UI';
import { CookieHandler } from '@lib/utils/cookieHandler';
import { Leaderboard } from '@lib/components/leaderboard';
import { Looper } from '@lib/looper';
import { Stadium } from '@lib/components/stadium';
import { Garage } from '@lib/components/garage';
import { NeuralNetwork } from '@lib/components/neuralNetwork';
import { NaturalSelection } from '@lib/components/naturalSelection';

CookieHandler.init();

Stadium.init();
Garage.init();
NeuralNetwork.init();
NaturalSelection.init();
Leaderboard.init();
Looper.init();
UI.init();