import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react"
import styles from "./channels.less"
import { Button, Input, Modal, Space, Table, Tooltip, message, ConfigProvider } from "antd"
import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  QuestionCircleFilled,
  SafetyOutlined,
  SettingOutlined,
  WarningFilled,
  SearchOutlined,
} from "@ant-design/icons"
import classNames from "classnames"
import { ColumnsType } from "antd/es/table"
import NewChannelDialog, { ChannelInfo } from "@/components/NewChannelDialog"
import { useMutation, useQuery } from "react-query"
import { api } from "@/modules/axios.config"
import { defaultQueryClient } from "@/components/ReactQueryClientProvider"
import { AxiosResponse } from "axios"
import Option from "./option"
import zhCN from 'antd/es/locale/zh_CN';


const _columns: ColumnsType<any> = [
  {
    title: "#",
    width: 60,
    dataIndex: "No",
  },
  {
    title: "分组",
    width: 150,
    dataIndex: "Category",
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters  }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder="搜索分组"
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button onClick={() => {
            clearFilters && clearFilters();
            confirm()
          }
            } size="small" style={{ width: 90 }}>
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record.Category.toLowerCase().includes(value.toString().toLowerCase()),
  },
  {
    title: "频道名",
    width: 150,
    dataIndex: "Name",
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters  }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder="搜索频道名"
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button onClick={() => {
            clearFilters && clearFilters();
            confirm()
          }} size="small" style={{ width: 90 }}>
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record.Name.toLowerCase().includes(value.toString().toLowerCase()),
  },
  {
    title: "源地址",
    dataIndex: "URL",
    render(value) {
      return <span className={styles.liveUrl}>{value}</span>
    },
  },
  {
    title: "频道M3U8地址",
    dataIndex: "M3U8",
    render(value, record: ChannelInfo, index) {
      const Icons = [
        <QuestionCircleFilled style={{ color: "#CCC" }} />,
        <CheckCircleFilled style={{ color: "#52c41a" }} />,
        <WarningFilled style={{ color: "#faad14" }} />,
        <CloseCircleFilled style={{ color: "#ff4d4f" }} />,
        <WarningFilled style={{ color: "#faad14" }} />,
      ]

      return (
        <Space>
          <Tooltip
            title={
              <>
                {record.Message}
                <br />
                {record.LastUpdate}
              </>
            }
          >
            {Icons[record.Status]}
          </Tooltip>
          <span className={styles.m3u8}>{value}</span>
        </Space>
      )
    },
  },
  {
    title: "代理",
    width: 80,
    render(dom, rec) {
      return (
        <Space>
          {rec.Proxy && <CheckOutlined title="代理串流" />}
          {!!rec.ProxyUrl && <SafetyOutlined  title="通过代理连接" />}
        </Space>
      )
    },
  },
  {
    title: <MenuOutlined />,
    width: 80,
  },
]

function transformReq(ci: ChannelInfo) {
  return {
    id: ci.ID,
    url: ci.URL,
    name: ci.Name,
    proxy: ci.Proxy,
    parser: ci.Parser,
    proxyurl: ci.ProxyUrl,
    tsproxy: ci.TsProxy,
    category: ci.Category
  }
}

export default function Channels() {
  const [dialogShow, setDialogShow] = useState(false)
  const [optionShow, setOptionShow] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [playlistUrl, setPlayListUrl] = useState("")
  const [playlistTxtUrl, setPlayListTxtUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelInfo>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
  setSelectedRowKeys(newSelectedRowKeys);
};

const rowSelection = {
  selectedRowKeys,
  onChange: onSelectChange,
};
const hasSelected = selectedRowKeys.length > 0

  useEffect(() => {
    document.title = "频道列表 - LiveTV!"
  }, [])

  const doAddChannel = useMutation(
    (ci: ChannelInfo) =>
      api.post("/newchannel", transformReq(ci), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    {
      onSuccess() {
        defaultQueryClient.invalidateQueries("channelList")
      },
      onError(error: AxiosResponse) {
        message.error(error?.data ?? "未知错误")
      },
    }
  )

  const doDeleteChannel = useMutation((id: string) => api.get("/delchannel", { params: { id } }), {
    onSuccess() {
      defaultQueryClient.invalidateQueries("channelList")
    },
    onError(error: AxiosResponse) {
      message.error(error?.data ?? "未知错误")
    },
  })


  const doUpdateChannel = useMutation(
    (ci: ChannelInfo) =>
      api.post("/updatechannel", transformReq(ci), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    {
      onSuccess() {
        defaultQueryClient.invalidateQueries("channelList")
      },
      onError(error: AxiosResponse) {
        message.error(error?.data ?? "未知错误")
      },
    }
  )

  const { data: channels, isLoading: chLoading } = useQuery(
    "channelList",
    () =>
      api
        .get("/channels", {
          responseType: "json",
        })
        .then((res) => {
          const list = JSON.parse(res.data) as ChannelInfo[]
          if (Array.isArray(list) && list.length) {
            list.forEach((ch, idx) => {
              ch.Parser = ch.Parser || "youtube"
              ch.No = idx
            })
            setPlayListUrl(list.shift()!.M3U8)
            setPlayListTxtUrl(list.shift()!.M3U8)
          }
          return list ?? []
        }),
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  )

  function handleAddChannel() {
    setDialogMode("add")
    setDialogShow(true)
  }

  function handleFinish(ci: ChannelInfo) {
    setDialogShow(false)
    return dialogMode === "add" ? doAddChannel.mutateAsync(ci) : doUpdateChannel.mutateAsync(ci)
  }

  // copy m3u8 playlist to clipboard
  function handleCopyM3u(){
    handleCopy(playlistUrl)
  }

  function handleCopyTxt(){
    handleCopy(playlistTxtUrl)
  }

  function handleCopy(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 3000)
      })
      .catch((err) => {
        console.error("Failed to copy text:", err)
      })
  }

  const handleEditChannel = useCallback((ch: ChannelInfo) => {
    setEditingChannel(ch)
    setDialogMode("edit")
    setDialogShow(true)
  }, [])
  
  const handleBatchDelete = () => {
    Modal.confirm({
      title: "批量删除频道",
      content: '你真的想删除选中的频道吗?',
      okText: "删除",
      cancelText: "取消",
      okType: "danger",
      onOk() {
        selectedRowKeys.forEach(id => {
          doDeleteChannel.mutate(id.toString())
        })
        setSelectedRowKeys([])
      },
    })
  }
  const handleDeleteChannel = useCallback((ch: ChannelInfo) => {
    Modal.confirm({
      title: "删除频道",
      content: '你真的想删除 "' + ch.Name + '" 吗?',
      okText: "删除",
      cancelText: "取消",
      okType: "danger",
      onOk() {
        doDeleteChannel.mutate(ch.ID)
      },
    })
  }, [])

  const columns = useMemo(() => {
    _columns[_columns.length - 1].render = (dom, entity) => {
      return (
        <Space>
          <EditOutlined onClick={() => handleEditChannel(entity)} />
          <DeleteOutlined onClick={() => handleDeleteChannel(entity)} />
        </Space>
      )
    }
    return _columns
  }, [handleEditChannel, handleDeleteChannel])

  return (
    <ConfigProvider locale={zhCN}>
      <div className={styles.container}>
      <h1 className={styles.title}>
        <Space>
          LiveTV! <small>定制你自己的IPTV</small>
          <SettingOutlined style={{ fontSize: "16px" }} onClick={() => setOptionShow(true)} />
        </Space>
      </h1>
      <div className={styles.toolbar}>
        <div className={classNames([styles.playlist, "flex"])}>
          <span>m3u列表:&nbsp;&nbsp;</span>
          <Space.Compact style={{ flex: "1" }}>
            <Input value={playlistUrl} readOnly />
            <Tooltip title={copied ? "已复制" : "点击复制"}>
              <Button icon={<CopyOutlined />} onClick={handleCopyM3u} />
            </Tooltip>
          </Space.Compact>
        </div>
        <div className={classNames([styles.playlist, "flex"])}>
          <span>txt列表:&nbsp;&nbsp;</span>
          <Space.Compact style={{ flex: "1" }}>
            <Input value={playlistTxtUrl} readOnly />
            <Tooltip title={copied ? "已复制" : "点击复制"}>
              <Button icon={<CopyOutlined />} onClick={handleCopyTxt} />
            </Tooltip>
          </Space.Compact>
        </div>
        <div>
          <Button type="primary" onClick={handleAddChannel} style={{ marginLeft: "5px" }}>
            新增频道
          </Button>
          <Button type="primary" danger onClick={handleBatchDelete} disabled={!hasSelected} style={{ marginLeft: "5px" }}>
            批量删除
          </Button>
        </div>
      </div>
      <Table
        size="middle"
        locale={{
          emptyText: <div style={{ textAlign: "center" }}>还没添加过频道哦！</div>,
        }}
        scroll={{ x: "100%" }}
        rowKey={"ID"}
        dataSource={channels ?? []}
        loading={chLoading}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: [10, 20, 50, 100],
          showSizeChanger: true,
          
        }}
        rowSelection={rowSelection}
        
      />
      {/** dialogs */}
      <NewChannelDialog
        mode={dialogMode}
        visible={dialogShow}
        channel={editingChannel}
        onAdd={handleFinish}
        onCancel={() => setDialogShow(false)}
      />
      <Option visible={optionShow} onClose={() => setOptionShow(false)} />
    </div>
      </ConfigProvider>
    
  )
}
