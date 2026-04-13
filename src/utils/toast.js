import { getCurrentInstance } from 'vue'

function makeHtml(icon, title, message) {
    return `
        <div class="tazko-toast__inner">
            <div class="tazko-toast__bar"></div>
            <div class="tazko-toast__body">
                <div class="tazko-toast__icon">${icon}</div>
                <div class="tazko-toast__text">
                    <span class="tazko-toast__title">${title}</span>
                    ${message ? `<span class="tazko-toast__msg">${message}</span>` : ''}
                </div>
            </div>
        </div>
    `
}

export function useToast() {
    const { appContext } = getCurrentInstance()

    const successToast = (message = 'Success!', title = 'Done') => {
        appContext.config.globalProperties.$toast({
            text: makeHtml('✓', title, message === title ? '' : message),
            escapeMarkup: false,
            duration: 2500,
            gravity: 'top',
            position: 'right',
            className: 'tazko-toast tazko-toast--success',
            style: {},
            close: false,
        }).showToast()
    }

    const errorToast = (message = 'Something went wrong!', title = 'Error') => {
        appContext.config.globalProperties.$toast({
            text: makeHtml('✕', title, message === title ? '' : message),
            escapeMarkup: false,
            duration: 4000,
            gravity: 'top',
            position: 'right',
            className: 'tazko-toast tazko-toast--error',
            style: {},
            close: false,
        }).showToast()
    }

    const infoToast = (message = '', title = 'Info') => {
        appContext.config.globalProperties.$toast({
            text: makeHtml('ℹ', title, message === title ? '' : message),
            escapeMarkup: false,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            className: 'tazko-toast tazko-toast--info',
            style: {},
            close: false,
        }).showToast()
    }

    return { successToast, errorToast, infoToast }
}
