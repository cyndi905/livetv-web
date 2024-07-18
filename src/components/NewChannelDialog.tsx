import { api } from "@/modules/axios.config"
import { AutoComplete, Checkbox, Form, Input, InputRef, Modal, Select } from "antd"
import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "react-query"
import styles from "./NewChannelDialog.less"
import { BaseOptionType } from "antd/es/select"
import { defaultQueryClient } from "./ReactQueryClientProvider"
const { TextArea } = Input

export interface ChannelInfo {
  No: number
  ID: string
  URL: string
  Name: string
  Parser: string
  M3U8: string
  Proxy: boolean
  TsProxy: string
  ProxyUrl: string
  LastUpdate: string
  Status: number
  Message: string
  Category: string
}

interface dlgProps {
  mode: "add" | "edit"
  visible: boolean
  channel?: ChannelInfo
  onAdd: (ci: ChannelInfo) => Promise<unknown>
  onCancel: () => void
}

export default function NewChannelDialog(props: dlgProps) {
  const [form] = Form.useForm()
  const [busy, setBusy] = useState(false)
  const [needProxy, setNeedProxy] = useState(false)
  const { Option } = Select
  const inputRef = useRef<InputRef>(null)
  const [customTsProxy, setCustomTsProxy] = useState("")
  const [categoryVal, setCategoryVal] = useState<string>("")
  const { data: parsers } = useQuery("parsers", () =>
    api.get("/plugins").then((res) => JSON.parse(res.data).map((p: string) => ({ label: p, value: p })))
  )
  const { data: CategoryList } = useQuery<BaseOptionType[]>("category", () =>
    api.get("/category").then((res) => JSON.parse(res.data).map((p: string) => ({ value: p })))
  )

  const filteredCategory = useMemo(() => {
    const value = categoryVal.trim()
    if (!value) return CategoryList
    return CategoryList?.filter((c: any) => c.value.includes(value)) ?? []
  }, [CategoryList, categoryVal])

  function handleSubmit() {
    form?.validateFields().then((values) => {
      setBusy(true)
      props
        .onAdd({
          ...values,
          Proxy: values.Proxy && values.Proxy !== "0",
          TsProxy: values.Proxy === "2" ? customTsProxy : "",
          ProxyUrl: values.UseProxy ? values.ProxyUrl : "",
        })
        .then(() => {
          // update category list if a new category is added
          if (categoryVal && !CategoryList?.find((v) => v.value === categoryVal)) {
            defaultQueryClient.invalidateQueries("category")
          }
        })
        .finally(() => {
          setBusy(false)
        })
    })
  }

  // reset form on show
  useEffect(() => {
    if (props.visible) {
      setNeedProxy(false)
      setCategoryVal("")
      form?.resetFields()
      form?.setFieldValue("Parser", "youtube")
      if (props.mode === "edit") {
        form?.setFieldsValue({
          ...props.channel,
          Proxy: props.channel!.Proxy ? (props.channel!.TsProxy ? "2" : "1") : "0",
          UseProxy: !!props.channel!.ProxyUrl,
        })
        setNeedProxy(!!props.channel!.ProxyUrl)
        setCustomTsProxy(props.channel!.TsProxy)
      }
    }
  }, [props.visible])

  function handleValuesChange(_: any, { UseProxy }: any) {
    setNeedProxy(!!UseProxy)
  }

  return (
    <Modal
      open={props.visible}
      onCancel={props.onCancel}
      onOk={handleSubmit}
      destroyOnClose={true}
      maskClosable={false}
      confirmLoading={busy}
      title={props.mode === "add" ? "添加频道" : "编辑频道"}
      okText="确定"
      cancelText="取消"
    >
      <div style={{ marginTop: 20 }}>
        <Form labelCol={{ span: 6 }} form={form} onValuesChange={handleValuesChange}>
          <Form.Item name="ID" hidden />
          <Form.Item label="频道名" name="Name" rules={[{ required: true }]}>
            <Input placeholder="频道名" allowClear />
          </Form.Item>
          <Form.Item label="源地址" name="URL" rules={[{ required: true }]}>
          {props.mode === "add" ? (
          <TextArea placeholder="支持导入多个源，请以“#”隔开，例如：https://example1.com #https://example2.com" allowClear />
        ) : (
          <Input placeholder="URL" allowClear />
        )}
          </Form.Item>
          <Form.Item label="解析器" name="Parser" rules={[{ required: true }]}>
            <Select placeholder="" options={parsers} />
          </Form.Item>
          <Form.Item label="分组" name="Category">
            <AutoComplete
              placeholder="选择或输入一个新分组"
              options={filteredCategory}
              onSearch={setCategoryVal}
            />
          </Form.Item>
          <Form.Item label="串流代理" name="Proxy">
            <Select optionLabelProp="title" defaultValue={"0"}>
              <Option value="0" title="无代理">
              无代理
              </Option>
              <Option value="1" title="与baseurl相同">
                与baseurl相同
              </Option>
              <Option value="2" title={"自定义: " + customTsProxy}>
                <div className={styles.TsProxySelector}>
                  <span>自定义:</span>
                  <Input
                    ref={inputRef}
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.focus()
                    }}
                    onDoubleClick={() => {
                      inputRef.current?.select()
                    }}
                    placeholder="https://example.com"
                    value={customTsProxy}
                    onChange={(e) => setCustomTsProxy(e.target.value)}
                  />
                </div>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item label="使用代理" name="UseProxy" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item label="代理url" name="ProxyUrl" hidden={!needProxy}>
            <Input placeholder="socks5://user:password@example.com:443" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
