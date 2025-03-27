<template>
  <el-form 
    :model="form" 
    label-width="100px"
    ref="formRef"
  >
    <el-form-item
      label="部署环境"
      prop="environment"
      :rules="[{ required: true, message: '请选择环境' }]"
    >
      <el-select v-model="form.environment">
        <el-option label="生产环境" value="prod"/>
        <el-option label="测试环境" value="test"/>
        <el-option label="开发环境" value="dev"/>
      </el-select>
    </el-form-item>

    <el-form-item
      label="部署策略"
      prop="strategy"
      :rules="[{ required: true, message: '请选择策略' }]"
    >
      <el-radio-group v-model="form.strategy">
        <el-radio label="rolling">滚动更新</el-radio>
        <el-radio label="blue-green">蓝绿部署</el-radio>
        <el-radio label="canary">灰度发布</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item
      label="通知方式"
      prop="notify"
    >
      <el-checkbox-group v-model="form.notify">
        <el-checkbox label="email">邮件通知</el-checkbox>
        <el-checkbox label="sms">短信通知</el-checkbox>
        <el-checkbox label="webhook">Webhook</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">立即部署</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  props: {
    packageInfo: Object
  },

  data() {
    return {
      form: {
        environment: 'test',
        strategy: 'rolling',
        notify: []
      }
    }
  },

  methods: {
    submitForm() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          this.$emit('submit', {
            ...this.form,
            version: this.packageInfo.version
          })
        }
      })
    }
  }
}
</script>