export { }

declare global {
    interface Window {
        api: {
            logToMain: (text: any) => undefined,
            saveGame: (worlds: any, playerData: any, save: string, meta: any, stats: any, settings: any, droppedItems: any) => undefined,
            checkForSaves: (save: string) => any,
            getWorldData: (save: string) => any,
            changeDCState: (state: string, message: string) => undefined,
            saveNameAndDesc: (name: string, description: string, save: string) => undefined,
            getStats: (save: string) => any,
            fetchSettings: () => any,
            saveSettings: (settings: any) => undefined,
            fetchAchievements: () => any,
            grantAchievement: (achievement: string) => undefined,
            fetchGlobalStats: () => any
        };
    }
}