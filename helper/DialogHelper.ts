declare var document: Document;
interface HTMLDialogElement extends HTMLElement {
    show(): void;
    dismiss(): void;
}

enum DialogID {
    dialogEnterPassword = 'dialog-enter-password',
    loadingDialog = 'loading-dialog',
    editModDialog = 'edit-mod-dialog',
    dialogNeedRefresh = 'dialog-need-refresh',
    saveChangeDialog = 'save-change-dialog',
    addPresetDialog = 'add-preset-dialog',
}

class DialogHelper {
    static async showDialog(dialogID: DialogID) {
        // 因为会被js调用，所以说需要判断dialogID是否为DialogID之一
        if (!Object.values(DialogID).includes(dialogID)) {
            // 如果是字符串的话，直接使用字符串，而不用枚举
                console.error(`dialog ${DialogID[dialogID]} is not a valid DialogID`);
                throw new Error(`dialog ${DialogID[dialogID]} is not a valid DialogID`);
        }
        const dialog = document.getElementById(dialogID) as HTMLDialogElement;
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        dialog.show();
    }

    static async dismissDialog(dialogID: DialogID) {
        // 因为会被js调用，所以说需要判断dialogID是否为DialogID之一
        if (!Object.values(DialogID).includes(dialogID)) {
            // 如果是字符串的话，直接使用字符串，而不用枚举
                console.error(`dialog ${DialogID[dialogID]} is not a valid DialogID`);
                throw new Error(`dialog ${DialogID[dialogID]} is not a valid DialogID`);
        }
        const dialog = document.getElementById(dialogID) as HTMLDialogElement;
        if (!dialog) {
            console.log(`dialog ${dialogID} not found`);
            return;
        }
        dialog.dismiss();
    }
}   

export { DialogID, DialogHelper };