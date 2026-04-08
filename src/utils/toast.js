import { getCurrentInstance } from 'vue'
export function useToast() {
    const { appContext } = getCurrentInstance()

    const successToast = (message = "Success!") => {
        const toast = appContext.config.globalProperties.$toast
        toast({
            text: message,
            duration: 1500,
            gravity: "top",
            position: "center",
            style: {
                color: "#155724",
                background: "#d4edda",
                borderRadius: "6px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
            },
            close: true
        }).showToast()
    }

    const errorToast = (message = "Something went wrong!") => {
        const toast = appContext.config.globalProperties.$toast
        toast({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "center",
            style: {
                color: "#721c24",
                background: "#f8d7da",
                borderRadius: "6px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
            },
            close: true
        }).showToast()
    }

    return { successToast, errorToast }
}
