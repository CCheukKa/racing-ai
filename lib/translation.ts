export type SupportedLanguage = "en-GB" | "zh-HK";

export enum TranslationKey {
    LanguageButtonLabel = "LanguageButtonLabel",
    LanguageButtonTitle = "LanguageButtonTitle",
    ClearStadiumButton = "ClearStadiumButton",
    RacingStadium = "RacingStadium",
    Garage = "Garage",
    NeuralNetwork = "NeuralNetwork",
    NaturalSelection = "NaturalSelection",
    LeaderboardHeading = "LeaderboardHeading",
    TutorialText = "TutorialText",
    ScoringText = "ScoringText",
    FrontText = "FrontText",
    BackText = "BackText",
    ProbeLabel = "ProbeLabel",
    InputLayerTitle = "InputLayerTitle",
    ProbeDist = "ProbeDist",
    CarSpeed = "CarSpeed",
    CarAngle = "CarAngle",
    CarPosition = "CarPosition",
    TrackAngle = "TrackAngle",
    LapCount = "LapCount",
    OnTrackQuestion = "OnTrackQuestion",
    RoadScore = "RoadScore",
    PerfScore = "PerfScore",
    CurrentTick = "CurrentTick",
    Input = "Input",
    Hidden = "Hidden",
    Output = "Output",
    TicksPerGeneration = "TicksPerGeneration",
    TargetPopulationSize = "TargetPopulationSize",
    SurvivalHarshness = "SurvivalHarshness",
    ReproductionHarshness = "ReproductionHarshness",
    NeuralNetworkMutationRate = "NeuralNetworkMutationRate",
    ParentShouldMutate = "ParentShouldMutate",
    Gen = "Gen",
    Population = "Population",
    Survival = "Survival",
    BestScore = "BestScore",
    Start = "Start",
    StopAfterThis = "StopAfterThis",
    Rank = "Rank",
    ID = "ID",
    Score = "Score",
    Lap = "Lap",
    Speed = "Speed",
    OnTrack = "OnTrack",
    ExportSelectedCar = "ExportSelectedCar",
    ResetLeaderboard = "ResetLeaderboard",
    ImportCar = "ImportCar",
    ResetSettings = "ResetSettings",
    RaceModeQuestion = "RaceModeQuestion",
    MaxTpsEst = "MaxTpsEst",
    CurrentTps = "CurrentTps",
    TargetTps = "TargetTps",
    DragPrompt = "DragPrompt",
    TipsLabel = "TipsLabel",
    TickCounterPrefix = "TickCounterPrefix",
    LeaderboardName = "LeaderboardName",
    LeaderboardHash = "LeaderboardHash",
    LeaderboardScore = "LeaderboardScore",
    LeaderboardLap = "LeaderboardLap",
    LeaderboardAvgSpeed = "LeaderboardAvgSpeed",
    LeaderboardOnTrack = "LeaderboardOnTrack",
    LeaderboardGeneration = "LeaderboardGeneration",
    LeaderboardInputs = "LeaderboardInputs",
    LeaderboardLayers = "LeaderboardLayers",
    LeaderboardAngles = "LeaderboardAngles",
    ResetSettingsConfirm = "ResetSettingsConfirm",
    ImportInvalidFiles = "ImportInvalidFiles",
    ImportManyConfirm = "ImportManyConfirm",
    ImportOneConfirm = "ImportOneConfirm",
    ResetLeaderboardConfirm = "ResetLeaderboardConfirm",
    SelectLeaderboardCarFirst = "SelectLeaderboardCarFirst",
    LeaderboardCarNamePrompt = "LeaderboardCarNamePrompt",
    HiddenLayerSizeLimitAlert = "HiddenLayerSizeLimitAlert",
    ClearStadiumConfirm = "ClearStadiumConfirm",
    TickLoopPause = "TickLoopPause",
    TickLoopResume = "TickLoopResume",
    TipVersatilityImportant = "TipVersatilityImportant",
    TipStayOnTrack = "TipStayOnTrack",
    TipHighTps = "TipHighTps",
    TipChooseInputsThoughtfully = "TipChooseInputsThoughtfully",
    TipTweakControlsBetweenGenerations = "TipTweakControlsBetweenGenerations",
    TipChangeStadiumBetweenGenerations = "TipChangeStadiumBetweenGenerations",
    TipChangeGarageProbeAngles = "TipChangeGarageProbeAngles",
    TipDrawOwnTracks = "TipDrawOwnTracks",
    TipExportGoodCars = "TipExportGoodCars",
    TipThinkAboutControls = "TipThinkAboutControls",
    TipMoreLayersDoesNotGuaranteeBetter = "TipMoreLayersDoesNotGuaranteeBetter",
    TipUseLeaderboard = "TipUseLeaderboard",
    TipUseCarPeeker = "TipUseCarPeeker",
    TipUseImportExport = "TipUseImportExport",
    TipSettingsSaved = "TipSettingsSaved",
    TipEnableRaceMode = "TipEnableRaceMode",
    TipResetSettings = "TipResetSettings",
    TipResetLeaderboard = "TipResetLeaderboard",
    TipClearStadium = "TipClearStadium",
    TipDragDropCars = "TipDragDropCars",
}

export type TranslationBundle = {
    languageButtonLabel: string;
    languageButtonTitle: string;
    cssVariables: Record<string, string>;
    tipsLabel: string;
    tips: string[];
    staticHtml: Record<string, string>;
    staticText: Record<string, string>;
    staticTitle: Record<string, string>;
    runtimeText: {
        leaderboardName: string;
        leaderboardHash: string;
        leaderboardScore: string;
        leaderboardLap: string;
        leaderboardAvgSpeed: string;
        leaderboardOnTrack: string;
        leaderboardGeneration: string;
        leaderboardInputs: string;
        leaderboardLayers: string;
        leaderboardAngles: string;
    };
    prompts: {
        resetSettingsConfirm: string;
        importInvalidFiles: string;
        importManyConfirm: (count: number, hashes: string) => string;
        importOneConfirm: (hash: string) => string;
        resetLeaderboardConfirm: string;
        selectLeaderboardCarFirst: string;
        leaderboardCarNamePrompt: string;
        hiddenLayerSizeLimitAlert: string;
        clearStadiumConfirm: string;
        tickLoopPause: string;
        tickLoopResume: string;
    };
};

export function getTranslationValue(bundle: TranslationBundle, key: TranslationKey): string | ((...args: any[]) => string) {
    switch (key) {
        case TranslationKey.LanguageButtonLabel: return bundle.languageButtonLabel;
        case TranslationKey.LanguageButtonTitle: return bundle.languageButtonTitle;
        case TranslationKey.ClearStadiumButton: return bundle.staticText["#clearStadiumButton"]!;
        case TranslationKey.RacingStadium: return bundle.staticHtml["#stadiumContainer .whatText"]!;
        case TranslationKey.Garage: return bundle.staticHtml[".garageContainer .whatText"]!;
        case TranslationKey.NeuralNetwork: return bundle.staticHtml[".neuralNetworkContainer .whatText"]!;
        case TranslationKey.NaturalSelection: return bundle.staticHtml[".naturalSelectionContainer .whatText"]!;
        case TranslationKey.LeaderboardHeading: return bundle.staticHtml[".leaderboardContainer .whatText"]!;
        case TranslationKey.TutorialText: return bundle.staticHtml["#stadiumContainer .tutorialText"]!;
        case TranslationKey.ScoringText: return bundle.staticHtml[".scoring"]!;
        case TranslationKey.FrontText: return bundle.staticText["#frontText"]!;
        case TranslationKey.BackText: return bundle.staticText["#backText"]!;
        case TranslationKey.ProbeLabel: return bundle.staticText["label[for='probeAngles']"]!;
        case TranslationKey.InputLayerTitle: return bundle.staticText[".neuralNetworkContainer .title"]!;
        case TranslationKey.ProbeDist: return bundle.staticText["label[for='probeDistances']"]!;
        case TranslationKey.CarSpeed: return bundle.staticText["label[for='carSpeed']"]!;
        case TranslationKey.CarAngle: return bundle.staticText["label[for='carAngle']"]!;
        case TranslationKey.CarPosition: return bundle.staticText["label[for='carPosition']"]!;
        case TranslationKey.TrackAngle: return bundle.staticText["label[for='trackAngle']"]!;
        case TranslationKey.LapCount: return bundle.staticText["label[for='lapCount']"]!;
        case TranslationKey.OnTrackQuestion: return bundle.staticText["label[for='onTrack']"]!;
        case TranslationKey.RoadScore: return bundle.staticText["label[for='roadScore']"]!;
        case TranslationKey.PerfScore: return bundle.staticText["label[for='performanceScore']"]!;
        case TranslationKey.CurrentTick: return bundle.staticText["label[for='tickNumber']"]!;
        case TranslationKey.Input: return bundle.staticText[".inputLayerContainer .layerLabel"]!;
        case TranslationKey.Hidden: return bundle.staticText[".hiddenLayersContainer .layerLabel"]!;
        case TranslationKey.Output: return bundle.staticText[".outputLayerContainer .layerLabel"]!;
        case TranslationKey.TicksPerGeneration: return bundle.staticText["label[for='tickLimit']"]!;
        case TranslationKey.TargetPopulationSize: return bundle.staticText["label[for='populationSize']"]!;
        case TranslationKey.SurvivalHarshness: return bundle.staticText["label[for='survivalHarshness']"]!;
        case TranslationKey.ReproductionHarshness: return bundle.staticText["label[for='reproductionHarshness']"]!;
        case TranslationKey.NeuralNetworkMutationRate: return bundle.staticText["label[for='mutationRate']"]!;
        case TranslationKey.ParentShouldMutate: return bundle.staticText["label[for='parentShouldMutate']"]!;
        case TranslationKey.Gen: return bundle.staticText[".naturalSelectionContainer .statusBoard .header div:nth-child(1)"]!;
        case TranslationKey.Population: return bundle.staticText[".naturalSelectionContainer .statusBoard .header div:nth-child(2)"]!;
        case TranslationKey.Survival: return bundle.staticText[".naturalSelectionContainer .statusBoard .header div:nth-child(3)"]!;
        case TranslationKey.BestScore: return bundle.staticText[".naturalSelectionContainer .statusBoard .header div:nth-child(4)"]!;
        case TranslationKey.Start: return bundle.staticText["#tickLoopButton"]!;
        case TranslationKey.StopAfterThis: return bundle.staticText["#generationLoopButton"]!;
        case TranslationKey.Rank: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(1)"]!;
        case TranslationKey.ID: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(2)"]!;
        case TranslationKey.Score: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(4)"]!;
        case TranslationKey.Lap: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(5)"]!;
        case TranslationKey.Speed: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(6)"]!;
        case TranslationKey.OnTrack: return bundle.staticText[".leaderboardContainer .leaderboardTableContainer .header div:nth-child(7)"]!;
        case TranslationKey.ExportSelectedCar: return bundle.staticText["#exportSelectedCarButton"]!;
        case TranslationKey.ResetLeaderboard: return bundle.staticText["#resetLeaderboardButton"]!;
        case TranslationKey.ImportCar: return bundle.staticText["#importCar"]!;
        case TranslationKey.ResetSettings: return bundle.staticText["#resetSettingsButton"]!;
        case TranslationKey.RaceModeQuestion: return bundle.staticText["label[for='raceModeButton']"]!;
        case TranslationKey.MaxTpsEst: return bundle.staticText[".tickSpeedControls > div:nth-child(1) span:nth-child(1)"]!;
        case TranslationKey.CurrentTps: return bundle.staticText[".tickSpeedControls > div:nth-child(2) span:nth-child(1)"]!;
        case TranslationKey.TargetTps: return bundle.staticText[".tickSpeedControls > div:nth-child(3) span:nth-child(1)"]!;
        case TranslationKey.DragPrompt: return bundle.staticText["#dragPrompt"]!;
        case TranslationKey.TipsLabel: return bundle.tipsLabel;
        case TranslationKey.TickCounterPrefix: return bundle === undefined ? "Tick" : (bundle.languageButtonLabel === "EN/中" ? "Tick" : "刻");
        case TranslationKey.LeaderboardName: return bundle.runtimeText ? bundle.runtimeText.leaderboardName : "Name";
        case TranslationKey.LeaderboardHash: return bundle.runtimeText ? bundle.runtimeText.leaderboardHash : "Hash";
        case TranslationKey.LeaderboardScore: return bundle.runtimeText ? bundle.runtimeText.leaderboardScore : "Score";
        case TranslationKey.LeaderboardLap: return bundle.runtimeText ? bundle.runtimeText.leaderboardLap : "Lap";
        case TranslationKey.LeaderboardAvgSpeed: return bundle.runtimeText ? bundle.runtimeText.leaderboardAvgSpeed : "Avg Speed";
        case TranslationKey.LeaderboardOnTrack: return bundle.runtimeText ? bundle.runtimeText.leaderboardOnTrack : "On Track";
        case TranslationKey.LeaderboardGeneration: return bundle.runtimeText ? bundle.runtimeText.leaderboardGeneration : "Generation";
        case TranslationKey.LeaderboardInputs: return bundle.runtimeText ? bundle.runtimeText.leaderboardInputs : "Inputs";
        case TranslationKey.LeaderboardLayers: return bundle.runtimeText ? bundle.runtimeText.leaderboardLayers : "Layers";
        case TranslationKey.LeaderboardAngles: return bundle.runtimeText ? bundle.runtimeText.leaderboardAngles : "Angles";
        case TranslationKey.ResetSettingsConfirm: return bundle.prompts.resetSettingsConfirm;
        case TranslationKey.ImportInvalidFiles: return bundle.prompts.importInvalidFiles;
        case TranslationKey.ImportManyConfirm: return bundle.prompts.importManyConfirm;
        case TranslationKey.ImportOneConfirm: return bundle.prompts.importOneConfirm;
        case TranslationKey.ResetLeaderboardConfirm: return bundle.prompts.resetLeaderboardConfirm;
        case TranslationKey.SelectLeaderboardCarFirst: return bundle.prompts.selectLeaderboardCarFirst;
        case TranslationKey.LeaderboardCarNamePrompt: return bundle.prompts.leaderboardCarNamePrompt;
        case TranslationKey.HiddenLayerSizeLimitAlert: return bundle.prompts.hiddenLayerSizeLimitAlert;
        case TranslationKey.ClearStadiumConfirm: return bundle.prompts.clearStadiumConfirm;
        case TranslationKey.TickLoopPause: return bundle.prompts.tickLoopPause;
        case TranslationKey.TickLoopResume: return bundle.prompts.tickLoopResume;
        case TranslationKey.TipVersatilityImportant: return bundle.tips[0]!;
        case TranslationKey.TipStayOnTrack: return bundle.tips[1]!;
        case TranslationKey.TipHighTps: return bundle.tips[2]!;
        case TranslationKey.TipChooseInputsThoughtfully: return bundle.tips[3]!;
        case TranslationKey.TipTweakControlsBetweenGenerations: return bundle.tips[4]!;
        case TranslationKey.TipChangeStadiumBetweenGenerations: return bundle.tips[5]!;
        case TranslationKey.TipChangeGarageProbeAngles: return bundle.tips[6]!;
        case TranslationKey.TipDrawOwnTracks: return bundle.tips[7]!;
        case TranslationKey.TipExportGoodCars: return bundle.tips[8]!;
        case TranslationKey.TipThinkAboutControls: return bundle.tips[9]!;
        case TranslationKey.TipMoreLayersDoesNotGuaranteeBetter: return bundle.tips[10]!;
        case TranslationKey.TipUseLeaderboard: return bundle.tips[11]!;
        case TranslationKey.TipUseCarPeeker: return bundle.tips[12]!;
        case TranslationKey.TipUseImportExport: return bundle.tips[13]!;
        case TranslationKey.TipSettingsSaved: return bundle.tips[14]!;
        case TranslationKey.TipEnableRaceMode: return bundle.tips[15]!;
        case TranslationKey.TipResetSettings: return bundle.tips[16]!;
        case TranslationKey.TipResetLeaderboard: return bundle.tips[17]!;
        case TranslationKey.TipClearStadium: return bundle.tips[18]!;
        case TranslationKey.TipDragDropCars: return bundle.tips[19]!;
    }
}

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; buttonLabel: string; }[] = [
    { code: "en-GB", label: "English (UK)", buttonLabel: "EN/中" },
    { code: "zh-HK", label: "Chinese (Traditional)", buttonLabel: "EN/中" },
];

export const TRANSLATIONS: Record<SupportedLanguage, TranslationBundle> = {
    "en-GB": {
        languageButtonLabel: "EN/中",
        languageButtonTitle: "Switch language",
        cssVariables: {
            "--translation-empty-list": "No entries yet",
            "--ui-font-size": "16px",
        },
        tipsLabel: "Tip:",
        tips: [
            "Versatility is important.",
            "Stay on track.",
            "Try using as high a TPS as possible.",
            "Choose the neural network inputs thoughtfully.",
            "Try tweaking the natural selection controls in-between each generation.",
            "Try changing the stadium track in-between each generation.",
            "Use the garage to change the car's probe angles.",
            "Use the racing stadium to draw your own tracks.",
            "Export good cars to save them for later.",
            "Think about what each control does and what implications it has.",
            "Having more/larger layers, probes, and inputs do not guarantee better performance.",
            "Use the leaderboard to compare car performance.",
            "Use the car peeker to inspect car internals.",
            "Use the import/export functionality to share cars with others.",
            "Your settings are saved across refreshes.",
            "Enable race mode to get a larger stadium while disabling natural selection.",
            "Use the reset settings button to reset all settings to their defaults.",
            "Use the reset leaderboard button to reset the leaderboard.",
            "Use the clear stadium button to clear the racing stadium.",
            "You can drag and drop car JSON files to import them.",
        ],
        staticHtml: {
            "#stadiumContainer .whatText": "Racing Stadium",
            ".garageContainer .whatText": "Garage",
            ".neuralNetworkContainer .whatText": "Neural Network",
            ".naturalSelectionContainer .whatText": "Natural Selection",
            ".leaderboardContainer .whatText": "Leaderboard",
            "#stadiumContainer .tutorialText": "LMB: Draw Track<br />RMB: Erase Track",
            ".scoring": "<b>Road Score:</b><br />Every tick,<br />onTrack ⇒ +0.2, offTrack ⇒ -5<br />speed[-1,0,1,5] ⇒ [-3,-2,+1,+4]<br /><br /><b>Performance Score:</b><br />At the end,<br />lap (clockwise) ⇒ +100×(onTrack%)²<br />averageSpeed[0,1] ⇒ [-100,+100]<br /><br /><b>Total Score:</b><br />Road Score + Performance Score",
        },
        staticText: {
            "#clearStadiumButton": "🗑️ Clear Stadium",
            "#frontText": "Front (0°)",
            "#backText": "Back (180°)",
            "label[for='probeAngles']": "Probe°",
            ".neuralNetworkContainer .title": "Input Layer",
            "label[for='probeDistances']": "Probe Dist.",
            "label[for='carSpeed']": "Car Speed",
            "label[for='carAngle']": "Car Angle",
            "label[for='carPosition']": "Car Position",
            "label[for='trackAngle']": "Track Angle",
            "label[for='lapCount']": "Lap Count",
            "label[for='onTrack']": "On Track?",
            "label[for='roadScore']": "Road Score",
            "label[for='performanceScore']": "Perf. Score",
            "label[for='tickNumber']": "Current Tick",
            ".inputLayerContainer .layerLabel": "Input",
            ".hiddenLayersContainer .layerLabel": "Hidden",
            ".outputLayerContainer .layerLabel": "Output",
            "label[for='tickLimit']": "Ticks per Generation",
            "label[for='populationSize']": "Target Population Size",
            "label[for='survivalHarshness']": "Survival Harshness",
            "label[for='reproductionHarshness']": "Reproduction Harshness",
            "label[for='mutationRate']": "Neural Network Mutation Rate",
            "label[for='parentShouldMutate']": "Parent should Mutate?",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(1)": "Gen",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(2)": "Population",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(3)": "Survival",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(4)": "Best Score",
            "#tickLoopButton": "Start",
            "#generationLoopButton": "Stop after this",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(1)": "Rank",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(2)": "ID",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(3)": "Gen",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(4)": "Score",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(5)": "Lap",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(6)": "Speed",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(7)": "On Track",
            "#exportSelectedCarButton": "📤 Export Selected Car",
            "#resetLeaderboardButton": "🔄️ Reset Leaderboard",
            "#importCar": "📥 Import Car",
            "#resetSettingsButton": "🔄️ Reset Settings",
            "label[for='raceModeButton']": "🏁 Race mode?",
            ".tickSpeedControls > div:nth-child(1) span:nth-child(1)": "Max TPS (est.):",
            ".tickSpeedControls > div:nth-child(2) span:nth-child(1)": "Current TPS:",
            ".tickSpeedControls > div:nth-child(3) span:nth-child(1)": "Target TPS:",
            "#dragPrompt": "Drop car JSON files here to import them",
        },
        staticTitle: {
            "label[for='probeDistances']": "Distance to grass from each probe",
            "label[for='carSpeed']": "Current speed of the car",
            "label[for='carAngle']": "Current angle of the car (+X is 0)",
            "label[for='carPosition']": "Current position of the car (X, Y); Track centre is origin (0, 0)",
            "label[for='trackAngle']": "Angle between the car and the track center (+X is 0)",
            "label[for='lapCount']": "Current lap count of the car",
            "label[for='onTrack']": "Is the car currently on the track? (1/0 = Y/N)",
            "label[for='roadScore']": "Current road score of the car (See scoring system)",
            "label[for='performanceScore']": "Current performance score of the car (See scoring system)",
            "label[for='tickNumber']": "Current tick number",
            "label[for='tickLimit']": "Maximum number of ticks per generation",
            "label[for='populationSize']": "Number of cars in each generation",
            "label[for='survivalHarshness']": "Higher values mean lower-ranked cars are more likely to be eliminated (0 = no elimination)",
            "label[for='reproductionHarshness']": "Higher values mean lower-ranked cars are less likely to reproduce (0 = always reproduce), which decreases diversity",
            "label[for='mutationRate']": "Higher values mean children mutate more (0 = no mutations)",
            "label[for='parentShouldMutate']": "Whether parents should mutate between generations; Can lead to loss of good genes",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(1)": "The rank of the car in the leaderboard",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(2)": "The name or hash of the car",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(3)": "The generation of the car",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(4)": "The score of the car",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(5)": "The lap count of the car",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(6)": "The average speed of the car",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(7)": "The percentage of time the car is on the track",
        },
        runtimeText: {
            leaderboardName: "Name",
            leaderboardHash: "Hash",
            leaderboardScore: "Score",
            leaderboardLap: "Lap",
            leaderboardAvgSpeed: "Avg Speed",
            leaderboardOnTrack: "On Track",
            leaderboardGeneration: "Generation",
            leaderboardInputs: "Inputs",
            leaderboardLayers: "Layers",
            leaderboardAngles: "Angles",
        },
        prompts: {
            resetSettingsConfirm: "Are you sure you want to reset all settings? This will also refresh the page.",
            importInvalidFiles: "Failed to import car(s). Please ensure the file(s) are valid JSON car data files.",
            importManyConfirm: (count, hashes) => `Are you sure you want to import all ${count} cars?\n\nHashes:\n${hashes}`,
            importOneConfirm: (hash) => `Are you sure you want to import this car?\n\nHash:\n${hash}`,
            resetLeaderboardConfirm: "Are you sure you want to reset the leaderboard?",
            selectLeaderboardCarFirst: "Please select a car from the leaderboard first.",
            leaderboardCarNamePrompt: "Enter a name for the car (optional):",
            hiddenLayerSizeLimitAlert: "Hidden layer sizes must be between 1 and 50.",
            clearStadiumConfirm: "Are you sure you want to clear the stadium? This will remove all track data.",
            tickLoopPause: "Pause",
            tickLoopResume: "Resume",
        },
    },
    "zh-HK": {
        languageButtonLabel: "EN/中",
        languageButtonTitle: "切換語言",
        cssVariables: {
            "--translation-empty-list": "未有資料",
            "--ui-font-size": "14px",
        },
        tipsLabel: "提示:",
        tips: [
            "多樣性很重要。",
            "盡量保持在賽道上。",
            "盡可能嘗試使用較高的 TPS。",
            "請小心選擇神經網路的輸入數據。",
            "你可以在每一代之間調整自然選擇控制項。",
            "你可以在每一代之間調整賽道。",
            "你可以在車庫中調整車輛探針角度。",
            "你可以在賽車場自行繪製賽道。",
            "把表現好的車匯出，方便之後再用。",
            "想想每個控制項的作用與影響。",
            "更多/更大的層、感應器與輸入不一定可以達成更好表現。",
            "用排行榜比較車輛表現。",
            "用車輛預覽器查看車輛內部資訊。",
            "使用匯入/匯出與其他人分享車輛。",
            "設定會在重載頁面後保留。",
            "啟用比賽模式可放大賽道並停用自然選擇。",
            "使用重設設定按鈕可恢復預設值。",
            "使用重設排行榜按鈕可清空排行榜。",
            "使用清除賽道按鈕可清空賽道。",
            "可拖放車輛 JSON 檔案來匯入。",
        ],
        staticHtml: {
            "#stadiumContainer .whatText": "賽車場",
            ".garageContainer .whatText": "車庫",
            ".neuralNetworkContainer .whatText": "神經網路",
            ".naturalSelectionContainer .whatText": "自然選擇",
            ".leaderboardContainer .whatText": "排行榜",
            "#stadiumContainer .tutorialText": "滑鼠左鍵: 畫賽道<br />滑鼠右鍵: 擦除",
            ".scoring": "<b>道路分數:</b><br />每個 tick，<br />在賽道上 ⇒ +0.2，離開賽道 ⇒ -5<br />速度[-1,0,1,5] ⇒ [-3,-2,+1,+4]<br /><br /><b>表現分數:</b><br />每代結束時，<br />圈數(順時針) ⇒ +100×(在賽道上%)²<br />平均速度[0,1] ⇒ [-100,+100]<br /><br /><b>總分:</b><br />道路分數 + 表現分數",
        },
        staticText: {
            "#clearStadiumButton": "🗑️ 清除賽道",
            "#frontText": "前 (0°)",
            "#backText": "後 (180°)",
            "label[for='probeAngles']": "感應器°",
            ".neuralNetworkContainer .title": "輸入層",
            "label[for='probeDistances']": "感應距離",
            "label[for='carSpeed']": "車速",
            "label[for='carAngle']": "車輛角度",
            "label[for='carPosition']": "車輛位置",
            "label[for='trackAngle']": "賽道角度",
            "label[for='lapCount']": "圈數",
            "label[for='onTrack']": "在賽道上?",
            "label[for='roadScore']": "道路分數",
            "label[for='performanceScore']": "表現分數",
            "label[for='tickNumber']": "目前 Tick",
            ".inputLayerContainer .layerLabel": "輸入層",
            ".hiddenLayersContainer .layerLabel": "隱藏層",
            ".outputLayerContainer .layerLabel": "輸出層",
            "label[for='tickLimit']": "每代 Tick 數",
            "label[for='populationSize']": "目標車輛數量",
            "label[for='survivalHarshness']": "生存淘汰強度",
            "label[for='reproductionHarshness']": "繁殖篩選強度",
            "label[for='mutationRate']": "神經網路突變率",
            "label[for='parentShouldMutate']": "父代也要突變?",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(1)": "代數",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(2)": "族群大小",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(3)": "存活率",
            ".naturalSelectionContainer .statusBoard .header div:nth-child(4)": "最佳分數",
            "#tickLoopButton": "開始",
            "#generationLoopButton": "完成本代後停止",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(1)": "排名",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(2)": "ID",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(3)": "代數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(4)": "分數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(5)": "圈數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(6)": "速度",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(7)": "在賽道上",
            "#exportSelectedCarButton": "📤 匯出選取車輛",
            "#resetLeaderboardButton": "🔄️ 重設排行榜",
            "#importCar": "📥 匯入車輛",
            "#resetSettingsButton": "🔄️ 重設設定",
            "label[for='raceModeButton']": "🏁 比賽模式?",
            ".tickSpeedControls > div:nth-child(1) span:nth-child(1)": "最大 TPS (估計):",
            ".tickSpeedControls > div:nth-child(2) span:nth-child(1)": "目前 TPS:",
            ".tickSpeedControls > div:nth-child(3) span:nth-child(1)": "目標 TPS:",
            "#dragPrompt": "將車輛 JSON 檔拖曳到此處即可匯入",
        },
        staticTitle: {
            "label[for='probeDistances']": "每個感應器到草地的距離",
            "label[for='carSpeed']": "車輛目前速度",
            "label[for='carAngle']": "車輛目前角度 (+X 為 0)",
            "label[for='carPosition']": "車輛目前位置 (X, Y)；賽道中心為原點 (0, 0)",
            "label[for='trackAngle']": "車輛與賽道中心的夾角 (+X 為 0)",
            "label[for='lapCount']": "車輛目前圈數",
            "label[for='onTrack']": "車輛目前是否在賽道上？(1/0 = 是/否)",
            "label[for='roadScore']": "車輛目前道路分數 (見計分說明)",
            "label[for='performanceScore']": "車輛目前表現分數 (見計分說明)",
            "label[for='tickNumber']": "目前 tick 編號",
            "label[for='tickLimit']": "每代最大 tick 數",
            "label[for='populationSize']": "每代車輛數量",
            "label[for='survivalHarshness']": "數值越高，低排名車輛越容易被淘汰 (0 = 不淘汰)",
            "label[for='reproductionHarshness']": "數值越高，低排名車輛越不易繁殖 (0 = 一定繁殖)，會降低多樣性",
            "label[for='mutationRate']": "數值越高，子代突變越多 (0 = 無突變)",
            "label[for='parentShouldMutate']": "父代是否在代際之間也突變；可能導致優良基因流失",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(1)": "車輛在排行榜中的名次",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(2)": "車輛名稱或 Hash",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(3)": "車輛所屬代數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(4)": "車輛分數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(5)": "車輛圈數",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(6)": "車輛平均速度",
            ".leaderboardContainer .leaderboardTableContainer .header div:nth-child(7)": "車輛在賽道上的時間百分比",
        },
        runtimeText: {
            leaderboardName: "名稱",
            leaderboardHash: "Hash",
            leaderboardScore: "分數",
            leaderboardLap: "圈數",
            leaderboardAvgSpeed: "平均速度",
            leaderboardOnTrack: "在賽道上",
            leaderboardGeneration: "代數",
            leaderboardInputs: "輸入",
            leaderboardLayers: "層",
            leaderboardAngles: "角度",
        },
        prompts: {
            resetSettingsConfirm: "確定要重設所有設定嗎？這也會重載頁面。",
            importInvalidFiles: "匯入車輛失敗。請確認檔案為有效的車輛 JSON 資料。",
            importManyConfirm: (count, hashes) => `確定要匯入全部 ${count} 輛車嗎？\n\nHash:\n${hashes}`,
            importOneConfirm: (hash) => `確定要匯入這輛車嗎？\n\nHash:\n${hash}`,
            resetLeaderboardConfirm: "確定要重設排行榜嗎？",
            selectLeaderboardCarFirst: "請先在排行榜選取一輛車。",
            leaderboardCarNamePrompt: "請輸入車輛名稱（可選填）：",
            hiddenLayerSizeLimitAlert: "隱藏層大小必須介乎 1 至 50。",
            clearStadiumConfirm: "確定要清除賽道嗎？這會移除所有賽道資料。",
            tickLoopPause: "暫停",
            tickLoopResume: "繼續",
        },
    },
};
