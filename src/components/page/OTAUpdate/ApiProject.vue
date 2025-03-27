<template>
    <div>
        <!-- 主内容区域 -->
        <el-container>
            <!-- 头部区域，包含 VIN 码选择框 -->
            <el-header>
                <el-form :model="formData" :rules="rules" ref="formRef">
                    <el-form-item label="车辆 VIN" label-width="100px" prop="vehicle_vin">
                        <el-row :gutter="10">
                            <!-- 车辆 VIN 选择框 -->
                            <el-col :span="16">
                                <el-select
                                    v-model="formData.vehicle_vin"
                                    placeholder="请选择或输入车辆VIN"
                                    filterable
                                    allow-create
                                    clearable
                                    @change="handleVinChange"
                                >
                                    <el-option
                                        v-for="vin in vehicleVinList"
                                        :key="vin"
                                        :label="vin"
                                        :value="vin"
                                    />
                                </el-select>
                            </el-col>
                            <!-- 车辆状态显示区域 -->
                            <el-col :span="8">
                                <div class="vehicle-status">
                                    <span v-if="vehicleStatus === 'online'" class="status-online">
                                        <i class="el-icon-success"></i> 在线
                                    </span>
                                    <span v-if="vehicleStatus === 'offline'" class="status-offline">
                                        <i class="el-icon-error"></i> 离线
                                    </span>
                                </div>
                            </el-col>
                        </el-row>
                    </el-form-item>
                </el-form>
            </el-header>
            <!-- 侧边栏 -->
            <el-main>
                <el-aside width="200px" style="background-color: #f5f7fa;">
                    <el-menu :default-active="activeTask" class="el-menu-vertical-demo">
                        <el-menu-item
                            v-for="task in tasks"
                            :key="task.name"
                            @click="openTaskEditor(task)"
                        >
                            <el-checkbox v-model="task.checked" @click.stop>{{ task.label }}</el-checkbox>
                        </el-menu-item>
                    </el-menu>
                    <div class="task-actions">
                        <el-button type="primary" @click="selectAllTasks">全选</el-button>
                        <el-button @click="clearAllTasks">清空</el-button>
                    </div>
                </el-aside>
            </el-main>
        </el-container>
        <!-- 用例编写抽屉 -->
        <el-drawer
            :title="currentTask ? currentTask.label : '用例编写'"
            :visible.sync="drawerVisible"
            direction="rtl"
            :size="drawerWidth"
            :style="drawerStyle"
        >
            <el-form :model="taskForm" label-width="100px">
                <el-form-item label="发送参数">
                    <el-input
                        type="textarea"
                        v-model="taskForm.sendParams"
                        :rows="5"
                        placeholder="请输入发送参数"
                    />
                </el-form-item>
                <el-form-item label="响应参数">
                    <el-input
                        type="textarea"
                        v-model="taskForm.responseParams"
                        :rows="5"
                        placeholder="请输入响应参数"
                    />
                </el-form-item>
            </el-form>
            <div style="text-align: right; padding: 20px;">
                <el-button @click="drawerVisible = false">取消</el-button>
                <el-button type="primary" @click="saveTask">保存</el-button>
            </div>
        </el-drawer>
        <!-- 一键执行按钮 -->
        <div class="execute-button">
            <el-button type="primary" @click="executeTasks" :loading="isExecuting" size="large">一键执行</el-button>
        </div>
    </div>
</template>
<script>
import axios from "axios"; // 引入 axios 库
export default {
    data() {
        return {
            formData: {
                vehicle_vin: "", // 绑定的 VIN 值
            },
            vehicleVinList: ["VIN001", "VIN002", "VIN003"], // 默认 VIN 列表
            vehicleStatus: "", // 车辆状态（online/offline）
            activeTask: "", // 当前选中的任务
            tasks: [ // 任务列表
                { name: "task_send", label: "任务发送", checked: false, sendParams: "", responseParams: "" },
                { name: "task_validate", label: "任务校验", checked: false, sendParams: "", responseParams: "" },
                { name: "query_version", label: "查询版本", checked: false, sendParams: "", responseParams: "" },
                { name: "file_download", label: "文件下载", checked: false, sendParams: "", responseParams: "" },
                { name: "condition_check", label: "条件检查", checked: false, sendParams: "", responseParams: "" },
                { name: "program_flash", label: "刷写程序", checked: false, sendParams: "", responseParams: "" },
                { name: "upgrade_rollback", label: "升级回滚", checked: false, sendParams: "", responseParams: "" },
                { name: "cloud_interaction", label: "车云交互", checked: false, sendParams: "", responseParams: "" },
                { name: "m_core_communication", label: "M 核通信", checked: false, sendParams: "", responseParams: "" },
            ],
            rules: {
                vehicle_vin: [
                    { required: true, message: '请输入或选择车辆 VIN', trigger: 'blur' },
                ],
            },
            drawerVisible: false, // 控制用例编写抽屉的显示
            currentTask: null, // 当前编辑的任务
            taskForm: { // 用例编写表单
                sendParams: "",
                responseParams: "",
            },
            drawerStyle: { // 抽屉的样式
                top: "0",
                height: "0",
            },
            drawerWidth: "75%", // 抽屉宽度为原来的 1.5 倍
            isExecuting: false, // 是否正在执行任务
        };
    },
    mounted() {
        // 动态计算侧边栏的高度和位置
        this.calculateDrawerStyle();
        // 监听窗口大小变化
        window.addEventListener("resize", this.calculateDrawerStyle);
    },
    beforeDestroy() {
        // 移除监听
        window.removeEventListener("resize", this.calculateDrawerStyle);
    },
    methods: {
        // 监听 VIN 变化
        handleVinChange(vin) {
            if (vin) {
                this.getVehicleStatus(vin);
            } else {
                this.vehicleStatus = ""; // 清空状态
            }
        },
        // 模拟获取车辆状态
        getVehicleStatus(vin) {
            // 模拟后端返回的数据
            const mockResponse = {
                success: true,
                data: {
                    status: "online", // 模拟在线状态
                },
            };
            if (mockResponse.success) {
                this.vehicleStatus = mockResponse.data.status; // 更新状态
            } else {
                this.$message.error("获取车辆状态失败");
            }
        },
        // 全选任务
        selectAllTasks() {
            this.tasks.forEach(task => (task.checked = true));
        },
        // 清空任务
        clearAllTasks() {
            this.tasks.forEach(task => (task.checked = false));
        },
        // 打开用例编写界面
        openTaskEditor(task) {
            this.currentTask = task;
            this.taskForm.sendParams = task.sendParams || "";
            this.taskForm.responseParams = task.responseParams || "";
            this.drawerVisible = true;
            // 更新抽屉位置和高度
            this.calculateDrawerStyle();
        },
        // 保存用例
        saveTask() {
            if (this.currentTask) {
                this.currentTask.sendParams = this.taskForm.sendParams;
                this.currentTask.responseParams = this.taskForm.responseParams;
                this.$message.success("保存成功");
                this.drawerVisible = false;
            }
        },
        // 动态计算抽屉位置和高度
        calculateDrawerStyle() {
            const aside = document.querySelector(".el-aside");
            if (aside) {
                const { top, height } = aside.getBoundingClientRect();
                this.drawerStyle = {
                    top: `${top}px`,
                    height: `${height}px`,
                };
            }
        },
        // 一键执行任务
        async executeTasks() {
            const selectedTasks = this.tasks.filter(task => task.checked);
            if (!selectedTasks.length) {
                this.$message.warning("请先选择任务");
                return;
            }
            this.isExecuting = true;
            for (const task of selectedTasks) {
                // 发送任务指令
                const url = `http://your-api-endpoint/vehicle/${this.formData.vehicle_vin}/${task.name}`;
                const data = { sendParams: task.sendParams };
                try {
                    const response = await axios.post(url, data);
                    // 处理响应
                    const isSuccess = this.handleResponse(task, response.data);
                    // 保存任务结果
                    await this.saveTaskResult(task, isSuccess);
                } catch (error) {
                    console.error("任务执行失败:", error);
                    await this.saveTaskResult(task, false);
                }
            }
            this.isExecuting = false;
            this.$message.success("所有任务执行完成");
        },
        // 处理响应
        handleResponse(task, response) {
            const expectedResponse = task.responseParams;
            return response === expectedResponse;
        },
        // 保存任务结果到数据库
        async saveTaskResult(task, isSuccess) {
            const result = {
                taskName: task.name,
                vehicleVin: this.formData.vehicle_vin,
                sendParams: task.sendParams,
                receivedResponse: isSuccess ? task.responseParams : "任务失败",
                isSuccess,
            };
            // 调用后端接口保存结果
            console.log("保存任务结果:", result);
        },
    },
};
</script>
<style scoped>
.el-header {
    background-color: #ffffff;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
}
.el-aside {
    background-color: #f5f7fa;
    padding: 20px;
}
.el-menu-vertical-demo {
    border-right: none;
}
.task-actions {
    margin-top: 20px;
    text-align: center;
}
.vehicle-status {
    display: flex;
    align-items: center;
    height: 40px; /* 与输入框高度一致 */
    padding-left: 10px;
}
.status-online {
    color: #67C23A; /* 绿色表示在线 */
}
.status-offline {
    color: #F56C6C; /* 红色表示离线 */
}
.el-icon-success,
.el-icon-error {
    margin-right: 5px;
}
.execute-button {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
}
.execute-button .el-button {
    font-size: 16px;
    padding: 15px 30px;
}
</style>