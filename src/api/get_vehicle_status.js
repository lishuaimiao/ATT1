// src/api/vehicle.js
import request from "@/utils/request"; // 假设你有一个 request 工具

export function getVehicleStatus(vin) {
    return request({
        url: `/api/vehicle/status`,
        method: "get",
        params: { vin },
    });
}