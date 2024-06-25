const hostname = window.location.hostname;

export const baseUrl = `https://${hostname}`;

export const djangoUrl = `${baseUrl}:8000`;

export const webSocketUrl = `wss://${hostname}:8000/ws/`;

export const djangoDefaultImgUrl = "./img/defaultAvatar.jpg";

export const getImageRoute = (route) => {
    if (!route?.includes("http")) return djangoDefaultImgUrl;
    const imgRoute = route.split(":8000/")[1];
    return `${baseUrl}:3000/${imgRoute}`
}
