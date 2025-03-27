<template>
    <div class="deploy-container">
      <!-- 软件包制作区 -->
      <el-card class="package-creator">
        <div slot="header">
          <span>软件包制作</span>
        </div>
        <el-form :model="buildForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="Git 仓库">
                <el-select 
                  v-model="buildForm.repository" 
                  placeholder="选择代码仓库"
                  filterable
                  @change="loadBranches"
                >
                  <el-option
                    v-for="repo in repositories"
                    :key="repo.id"
                    :label="repo.name"
                    :value="repo.url"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="代码分支">
                <el-select
                  v-model="buildForm.branch"
                  placeholder="选择分支"
                  :loading="branchLoading"
                >
                  <el-option
                    v-for="b in branches"
                    :key="b.name"
                    :label="b.name"
                    :value="b.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
  
            <el-col :span="8">
              <el-form-item label="版本号">
                <el-select
                  v-model="buildForm.version"
                  placeholder="选择版本"
                  :loading="tagLoading"
                >
                  <el-option
                    v-for="t in tags"
                    :key="t.name"
                    :label="t.name"
                    :value="t.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-button
            type="primary"
            :loading="building"
            @click="startBuild"
          >
            {{ building ? '构建中...' : '启动构建' }}
          </el-button>
        </el-form>
      </el-card>
  
      <!-- 软件包列表 -->
      <el-card class="package-list">
        <div slot="header">
          <span>已构建软件包</span>
          <el-input
            v-model="searchKey"
            placeholder="搜索软件包"
            class="search-input"
            clearable
          />
        </div>
        
        <el-table
          :data="filteredPackages"
          stripe
          v-loading="listLoading"
        >
          <el-table-column
            prop="index"
            label="序号"
            width="80"
            type="index"
          />
          <el-table-column
            prop="version"
            label="版本号"
            width="150"
            sortable
          />
          <el-table-column
            prop="packageUrl"
            label="软件包地址"
            min-width="200"
          >
            <template slot-scope="{row}">
              <el-link
                type="primary"
                :href="row.packageUrl"
                target="_blank"
              >
                {{ row.packageUrl }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column
            prop="buildTime"
            label="构建时间"
            width="180"
            sortable
          />
          <el-table-column
            label="操作"
            width="220"
            fixed="right"
          >
            <template slot-scope="{row}">
              <el-button
                type="text"
                @click="handleDeploy(row)"
              >
                部署
              </el-button>
              <el-divider direction="vertical"/>
              <el-popconfirm
                title="确认删除该包吗？"
                @confirm="handleDelete(row.id)"
              >
                <el-button
                  slot="reference"
                  type="text"
                  style="color: #F56C6C"
                >
                  删除
                </el-button>
              </el-popconfirm>
              <el-divider direction="vertical"/>
              <el-button
                type="text"
                @click="handleDownload(row)"
              >
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 部署配置对话框 -->
      <el-dialog
        :title="'部署配置 - ' + (currentPackage && currentPackage.version)"
        :visible.sync="deployDialogVisible"
        width="600px"
      >
        <deploy-config-form
          v-if="deployDialogVisible"
          :package-info="currentPackage"
          @submit="handleDeploySubmit"
        />
      </el-dialog>
    </div>
  </template>
  
  <script>
  import DeployConfigForm from './DeployConfigForm.vue' // 添加 .vue 扩展名
  
  export default {
    components: { DeployConfigForm },
    
    data() {
      return {
        buildForm: {
          repository: '',
          branch: '',
          version: ''
        },
        repositories: [],
        branches: [],
        tags: [],
        branchLoading: false,
        tagLoading: false,
        building: false,
        packages: [],
        listLoading: false,
        searchKey: '',
        deployDialogVisible: false,
        currentPackage: null
      }

    },
  
    computed: {
      filteredPackages() {
        return this.packages.filter(p => 
          p.version.includes(this.searchKey) || 
          p.packageUrl.includes(this.searchKey)
        )
      }
    },
  
    async created() {
      await this.loadRepositories()
      await this.loadPackages()
    },
  
    methods: {
      async loadRepositories() {
        // 调用API获取仓库列表
        this.repositories = await this.$api.getRepositories()
      },
  
      async loadBranches() {
        this.branchLoading = true
        try {
          this.branches = await this.$api.getBranches(this.buildForm.repository)
        } finally {
          this.branchLoading = false
        }
      },
  
      async loadTags() {
        this.tagLoading = true
        try {
          this.tags = await this.$api.getTags(this.buildForm.repository, this.buildForm.branch)
        } finally {
          this.tagLoading = false
        }
      },
  
      async startBuild() {
        try {
          this.building = true
          await this.$api.startBuildProcess({
            repo: this.buildForm.repository,
            branch: this.buildForm.branch,
            version: this.buildForm.version
          })
          this.$message.success('构建任务已启动')
          await this.loadPackages()
        } catch (error) {
          this.$message.error('构建失败: ' + error.message)
        } finally {
          this.building = false
        }
      },
  
      async loadPackages() {
        this.listLoading = true
        try {
          this.packages = await this.$api.getPackageList()
        } finally {
          this.listLoading = false
        }
      },
  
      handleDeploy(pkg) {
        this.currentPackage = pkg
        this.deployDialogVisible = true
      },
  
      async handleDelete(id) {
        await this.$api.deletePackage(id)
        this.$message.success('删除成功')
        this.loadPackages()
      },
  
      handleDownload(pkg) {
        window.open(pkg.downloadUrl, '_blank')
      },
  
      async handleDeploySubmit(config) {
        try {
          await this.$api.startDeployment({
            packageId: this.currentPackage.id,
            config
          })
          this.$message.success('部署任务已启动')
          this.deployDialogVisible = false
        } catch (error) {
          this.$message.error('部署失败: ' + error.message)
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .deploy-container {
    padding: 20px;
  }
  
  .package-creator {
    margin-bottom: 20px;
  }
  
  .search-input {
    width: 300px;
    float: right;
  }
  
  .el-table {
    margin-top: 15px;
  }
  
  ::v-deep .el-link {
    font-family: monospace;
  }
  </style>