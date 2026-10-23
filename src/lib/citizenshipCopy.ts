import type { Lang } from "./i18n";

/** Vatandaşlık sayfası metinleri. Sabit bir TL/USD eşiği YAZILMAZ (brief §6: güncel mevzuat esas alınır). */
export const CIT: Record<
  Lang,
  {
    title: string;
    eyebrow: string;
    lead: string;
    disclaimerTitle: string;
    disclaimer: string;
    stepsTitle: string;
    steps: { h: string; p: string }[];
    collectionTitle: string;
    collectionLead: string;
    finderTitle: string;
    finderLead: string;
    finderCta: string;
    exploreCta: string;
    checksTitle: string;
    checks: string[];
    empty: string;
    reviewed: string;
  }
> = {
  tr: {
    eyebrow: "Yatırım yoluyla vatandaşlık",
    title: "Vatandaşlığa Uygun Gayrimenkuller",
    lead: "Yabancı yatırımcılar için ekibimizin ön incelemesinden geçmiş, seçilmiş bir koleksiyon. Her mülk fiyatın ötesinde, belge ve kısıtlar açısından tek tek değerlendirilir ve yönetici onayıyla yayınlanır.",
    disclaimerTitle: "Önemli bilgilendirme",
    disclaimer:
      "Ön inceleme resmî bir uygunluk kararı veya vatandaşlık garantisi değildir. Asgari yatırım tutarı, değerleme ve diğer şartlar güncel mevzuata göre belirlenir; alıcının uyruğu da edinim kısıtlarını etkileyebilir. Nihai değerlendirme yetkili kurumlar ve hukuk danışmanınız tarafından yapılır.",
    stepsTitle: "Nasıl ilerliyoruz?",
    steps: [
      { h: "İhtiyacınızı anlatın", p: "Bütçe, bölge, mülk türü ve zamanlama. Uyruğunuzu da paylaşın; bazı kısıtlar uyruğa göre değişir." },
      { h: "Ön incelemeli seçki", p: "Yalnızca belge kontrol listesi tamamlanmış ve yönetici onayı almış mülkleri öneririz." },
      { h: "Görüntüleme planı", p: "Seçtiğiniz mülkleri tek bir programda görmeniz için randevuları biz planlarız." },
      { h: "Hukuki süreç", p: "Değerleme, tapu ve başvuru adımlarında bağımsız hukuk danışmanınızla çalışmanızı öneririz." },
    ],
    collectionTitle: "Ön incelemeden geçen mülkler",
    collectionLead: "Koleksiyon yalnızca yönetici onayı almış ve incelemesi süresi geçmemiş mülkleri içerir.",
    finderTitle: "Size uygun mülkü bulalım",
    finderLead: "Kriterlerinizi paylaşın; yalnızca bu koleksiyon içinde, gerekçeleriyle uygun mülkleri gösterelim.",
    finderCta: "Bana uygun mülkü bul",
    exploreCta: "Koleksiyonu incele",
    checksTitle: "Her mülkte neleri kontrol ediyoruz?",
    checks: [
      "Güncel mevzuattaki asgari yatırım tutarı",
      "Resmî değerleme / değer tespiti",
      "Tapu türü ve uygunluğu",
      "Önceki mülkiyet ve devir geçmişi",
      "Konuma ve uyruğa göre yabancı edinim kısıtları",
      "Satış kısıtı / şerh gereklilikleri",
      "Güncel aracılık kuralları",
    ],
    empty: "Şu anda koleksiyonda yayında mülk yok.",
    reviewed: "Ön inceleme",
  },
  en: {
    eyebrow: "Citizenship by investment",
    title: "Citizenship-Eligible Properties (Pre-screened)",
    lead: "A curated collection for international buyers, pre-screened by our team. Every property is reviewed individually — documents and restrictions, not price alone — and published only after administrator approval.",
    disclaimerTitle: "Important notice",
    disclaimer:
      "Pre-screening is not an official eligibility decision or a guarantee of citizenship. The minimum investment amount, valuation and other conditions are set by current law, and the buyer's nationality may affect acquisition restrictions. The final assessment is made by the competent authorities and your legal adviser.",
    stepsTitle: "How it works",
    steps: [
      { h: "Tell us what you need", p: "Budget, area, property type and timing. Please share your nationality — some restrictions depend on it." },
      { h: "Pre-screened shortlist", p: "We only suggest properties whose document checklist is complete and approved by an administrator." },
      { h: "Viewing plan", p: "We schedule viewings so you can see your selected properties in a single itinerary." },
      { h: "Legal process", p: "We recommend working with an independent lawyer for valuation, title deed and application steps." },
    ],
    collectionTitle: "Pre-screened properties",
    collectionLead: "The collection only contains properties approved by an administrator whose review has not expired.",
    finderTitle: "Let us find the right property for you",
    finderLead: "Share your criteria and we will show suitable properties from this collection, with clear reasons.",
    finderCta: "Find my property",
    exploreCta: "Browse the collection",
    checksTitle: "What we check for each property",
    checks: [
      "Minimum investment amount under current law",
      "Official valuation / value determination",
      "Title deed type and eligibility",
      "Previous ownership and transfer history",
      "Foreign ownership restrictions by location and nationality",
      "Required sale restriction / annotation",
      "Current agency rules",
    ],
    empty: "No properties are currently published in the collection.",
    reviewed: "Pre-screened",
  },
  ru: {
    eyebrow: "Гражданство за инвестиции",
    title: "Недвижимость для программы гражданства (предварительная проверка)",
    lead: "Подборка для иностранных покупателей, прошедшая предварительную проверку нашей команды. Каждый объект оценивается отдельно — документы и ограничения, а не только цена — и публикуется после одобрения администратора.",
    disclaimerTitle: "Важная информация",
    disclaimer:
      "Предварительная проверка не является официальным решением о соответствии или гарантией гражданства. Минимальная сумма инвестиций, оценка и прочие условия определяются действующим законодательством; гражданство покупателя может влиять на ограничения. Окончательное решение принимают уполномоченные органы и ваш юрист.",
    stepsTitle: "Как мы работаем",
    steps: [
      { h: "Расскажите о задаче", p: "Бюджет, район, тип объекта и сроки. Укажите гражданство — от него зависят некоторые ограничения." },
      { h: "Проверенная подборка", p: "Предлагаем только объекты с полным пакетом проверки и одобрением администратора." },
      { h: "План просмотров", p: "Организуем просмотры так, чтобы вы увидели выбранные объекты за одну поездку." },
      { h: "Юридический процесс", p: "Рекомендуем работать с независимым юристом на этапах оценки, оформления и подачи заявления." },
    ],
    collectionTitle: "Объекты после предварительной проверки",
    collectionLead: "В подборке только объекты, одобренные администратором, с действующей проверкой.",
    finderTitle: "Подберём подходящий объект",
    finderLead: "Укажите критерии — покажем подходящие объекты из этой подборки с объяснением.",
    finderCta: "Подобрать объект",
    exploreCta: "Смотреть подборку",
    checksTitle: "Что мы проверяем",
    checks: [
      "Минимальная сумма инвестиций по действующему закону",
      "Официальная оценка стоимости",
      "Тип и пригодность титула (тапу)",
      "История владения и переходов",
      "Ограничения для иностранцев по местоположению и гражданству",
      "Требуемые ограничения / пометки о продаже",
      "Действующие правила посредничества",
    ],
    empty: "Сейчас в подборке нет опубликованных объектов.",
    reviewed: "Проверено",
  },
};
