export const TAG_DEFINITIONS = [
  { id: "ai", label: "AI", color: "violet", instructions: "`post` 是否实质涉及人工智能技术、模型、产品、研究、AI 生成内容或 AI 应用案例？", yes: "内容明确涉及 AI 的能力、产品、研究、使用效果，或使用 AI 生成视频、图片、文本等内容；AI 不必是唯一主题，也不要求说明具体模型", no: "AI 只在无关语境中被顺带提及，或仅作为空泛修饰词且没有任何 AI 使用或内容信息" },
  { id: "technology", label: "科技", color: "blue", instructions: "`post` 是否包含 AI 之外或更广泛的实质性科技内容？", yes: "核心内容涉及硬件、互联网、软件产业、前沿科学或其他科技发展", no: "没有实质科技信息，或只因提到 AI 而显得像科技内容" },
  { id: "developer_tools", label: "开发工具", color: "cyan", instructions: "`post` 是否包含有实质信息的程序开发工具、API、框架、代码库或工程实践？", yes: "包含工具发布或使用、代码、框架或 API、性能结果、迁移经验、工程实践或开发案例；不要求提供完整教程", no: "开发工具不是实质内容，或只提到工具名称而没有开发相关信息" },
  { id: "product_launch", label: "新品发布", color: "indigo", instructions: "`post` 是否在发布、推出或重大更新一个产品、功能、模型或服务？", yes: "明确宣布新产品、新功能、新版本、公开测试或重大更新", no: "不是发布信息，或仅是泛泛讨论某个已有产品" },
  { id: "industry_news", label: "行业资讯", color: "sky", instructions: "`post` 是否在报道值得关注的行业事件或最新动态？", yes: "包含公司动态、融资并购、政策变化、市场数据、人物变动或重要时效性事件", no: "不是新闻动态，主要是个人观点、教程或推广" },
  { id: "tutorial", label: "教程方法", color: "green", instructions: "`post` 是否提供可以跟随执行的教程、步骤、技巧或方法？", yes: "读者能据此完成任务、改进流程或学会具体技巧", no: "没有可操作方法，只是陈述、观点或宣传" },
  { id: "analysis", label: "观点分析", color: "amber", instructions: "`post` 是否以作者观点、推理、评论或趋势分析为主要价值？", yes: "重点是解释原因、判断影响、比较观点或预测趋势", no: "主要是事实快讯、产品发布或操作教程" },
  { id: "product_entrepreneurship", label: "产品创业", color: "orange", instructions: "`post` 是否主要讨论产品构建、创业、独立开发或经营公司？", yes: "涉及发现需求、做产品、创业过程、增长经营或独立开发经验", no: "与产品或创业实践无关" },
  { id: "monetization", label: "赚钱商业化", color: "lime", instructions: "`post` 是否实质讨论收入、盈利、变现、定价或商业模式？", yes: "核心内容包含如何赚钱、收入数据、盈利策略、定价或商业化路径", no: "没有实质商业化内容，或只是出现价格和金额" },
  { id: "social_growth", label: "社媒增长", color: "pink", instructions: "`post` 是否讨论社交媒体账号增长、内容策略、运营案例、涨粉结果或可执行方法？", yes: "包含 X、抖音、YouTube、小红书等平台的账号增长数据、成功或失败案例、内容选题或分发策略、涨粉经验、运营分析或方法；不要求提供完整教程", no: "只是在社交媒体发布内容或提到某个账号，没有增长结果、内容策略、运营分析或方法" },
] as const;

export type TagId = (typeof TAG_DEFINITIONS)[number]["id"];
export type TagDefinition = (typeof TAG_DEFINITIONS)[number];
export const TAG_BY_ID = Object.fromEntries(TAG_DEFINITIONS.map((tag) => [tag.id, tag])) as Record<TagId, TagDefinition>;
export const CLASSIFICATION_THRESHOLD = 0.7;
export const MAX_VISIBLE_TAGS = 3;
