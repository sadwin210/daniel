/* Артрология. J(название, латынь, {s: поверхности, t: тип, m: движения, g: связки, d: описание, p: список}) */
(function () {
  const J = (n, l, o) => Object.assign({ n, l }, o);

  window.ANATOMY = window.ANATOMY || [];
  window.ANATOMY.push({
    id: "arthrology",
    title: "Артрология",
    lat: "Arthrologia",
    about: "Учение о соединениях костей",
    topics: [
      {
        id: "general",
        title: "Общая артрология",
        note: "Виды соединений, строение и классификация суставов",
        items: [
          J("Классификация соединений костей", "Juncturae ossium", {
            d: "Все соединения костей делят на три группы.",
            p: [
              "Synarthrosis — непрерывное соединение (между костями прослойка ткани, полости нет)",
              "Symphysis (hemiarthrosis) — полусустав (хрящ с узкой щелью внутри)",
              "Diarthrosis (articulatio synovialis) — прерывное соединение, сустав",
            ],
          }),
          J("Фиброзные соединения", "Juncturae fibrosae", {
            d: "Кости соединены плотной соединительной тканью.",
            p: [
              "Syndesmosis — синдесмоз: ligamenta (связки), membranae interosseae (межкостные перепонки)",
              "Sutura — шов: sutura serrata (зубчатый), sutura squamosa (чешуйчатый), sutura plana (плоский)",
              "Gomphosis — вколачивание (зуб в альвеоле)",
            ],
          }),
          J("Хрящевые соединения", "Juncturae cartilagineae", {
            d: "Кости соединены хрящом.",
            p: [
              "Synchondrosis — синхондроз: временный (эпифизарные хрящи) и постоянный (I ребро с грудиной)",
              "Symphysis — симфиз: лобковый, межпозвоночный, рукоятки грудины",
            ],
          }),
          J("Костные соединения", "Synostosis", {
            d: "Замещение соединительной или хрящевой ткани костной. Примеры: крестец (os sacrum), тазовая кость (os coxae), зарастание швов черепа.",
          }),
          J("Строение сустава", "Articulatio synovialis", {
            d: "В каждом суставе есть обязательные элементы; вспомогательные встречаются не везде.",
            p: [
              "Facies articulares — суставные поверхности; cartilago articularis — суставной (гиалиновый) хрящ",
              "Capsula articularis — суставная капсула: membrana fibrosa (фиброзная мембрана, снаружи), membrana synovialis (синовиальная мембрана, изнутри)",
              "Cavitas articularis — суставная полость",
              "Synovia — синовиальная жидкость",
              "Ligamenta — связки: внекапсульные, капсульные, внутрикапсульные",
              "Discus articularis — суставной диск; meniscus articularis — суставной мениск",
              "Labrum articulare — суставная губа",
              "Bursa synovialis — синовиальная сумка; plica synovialis — синовиальная складка",
            ],
          }),
          J("Классификация суставов по строению", "Articulatio simplex, composita, complexa", {
            p: [
              "Articulatio simplex — простой сустав, две суставные поверхности: плечевой, межфаланговый",
              "Articulatio composita — сложный сустав, три и более поверхностей: локтевой, лучезапястный",
              "Articulatio complexa — комплексный сустав, внутри диск или мениски: коленный, височно-нижнечелюстной",
              "Комбинированный сустав — анатомически разные суставы, работающие вместе: оба височно-нижнечелюстных, проксимальный и дистальный луче-локтевые",
            ],
          }),
          J("Классификация суставов по форме и осям", "Classificatio articulationum", {
            p: [
              "Одноосные: articulatio trochoidea (цилиндрический), ginglymus (блоковидный), articulatio cochlearis (винтообразный)",
              "Двуосные: articulatio ellipsoidea (эллипсоидный), articulatio sellaris (седловидный), articulatio bicondylaris (мыщелковый)",
              "Многоосные: articulatio spheroidea (шаровидный), articulatio cotylica (чашеобразный), articulatio plana (плоский)",
              "Amphiarthrosis — амфиартроз, тугой малоподвижный сустав",
            ],
          }),
          J("Движения в суставах", "Motus articulares", {
            p: [
              "Фронтальная ось: flexio (сгибание) и extensio (разгибание)",
              "Сагиттальная ось: abductio (отведение) и adductio (приведение)",
              "Вертикальная (продольная) ось: rotatio (вращение) — pronatio (пронация, внутрь) и supinatio (супинация, наружу)",
              "Circumductio — круговое движение, при переходе с одной оси на другую",
            ],
          }),
        ],
      },
      {
        id: "skull",
        title: "Соединения черепа",
        note: "Швы, роднички, височно-нижнечелюстной сустав, соединение с позвоночником",
        items: [
          J("Швы черепа", "Suturae cranii", {
            d: "Кости свода соединены зубчатыми швами, чешуя височной кости — чешуйчатым швом, кости лица — плоскими швами. Кости основания соединены синхондрозами.",
            p: [
              "Sutura coronalis — венечный шов (лобная и теменные кости)",
              "Sutura sagittalis — сагиттальный шов (между теменными костями)",
              "Sutura lambdoidea — ламбдовидный шов (теменные и затылочная кости)",
              "Sutura squamosa — чешуйчатый шов (височная и теменная кости)",
              "Synchondrosis sphenooccipitalis — клиновидно-затылочный синхондроз",
            ],
          }),
          J("Роднички", "Fonticuli cranii", {
            d: "Неокостеневшие участки перепончатого черепа новорождённого.",
            p: [
              "Fonticulus anterior — передний (большой) родничок, ромбовидный; зарастает на 2-м году жизни",
              "Fonticulus posterior — задний (малый) родничок, треугольный; зарастает на 2–3-м месяце",
              "Fonticulus sphenoidalis — клиновидный родничок (парный)",
              "Fonticulus mastoideus — сосцевидный родничок (парный)",
            ],
          }),
          J("Височно-нижнечелюстной сустав", "Articulatio temporomandibularis", {
            s: "Головка нижней челюсти (caput mandibulae) и нижнечелюстная ямка (fossa mandibularis) с суставным бугорком (tuberculum articulare) височной кости. Внутри — суставной диск (discus articularis), делящий полость на два этажа.",
            t: "Мыщелковый (articulatio bicondylaris), комплексный, комбинированный — правый и левый работают вместе.",
            m: "Опускание и поднимание нижней челюсти; выдвижение вперёд и возвращение назад; боковые движения.",
            g: "Латеральная связка (lig. laterale); внекапсульные: клиновидно-нижнечелюстная (lig. sphenomandibulare) и шилонижнечелюстная (lig. stylomandibulare) связки.",
          }),
          J("Атлантозатылочный сустав", "Articulatio atlantooccipitalis", {
            s: "Затылочные мыщелки (condyli occipitales) и верхние суставные ямки атланта (foveae articulares superiores).",
            t: "Мыщелковый (эллипсоидный), комбинированный, двуосный.",
            m: "Вокруг фронтальной оси — сгибание и разгибание (кивательные движения); вокруг сагиттальной — наклоны головы в стороны.",
            g: "Передняя атлантозатылочная мембрана (membrana atlantooccipitalis anterior), задняя атлантозатылочная мембрана (membrana atlantooccipitalis posterior).",
          }),
          J("Срединный атлантоосевой сустав", "Articulatio atlantoaxialis mediana", {
            s: "Зуб осевого позвонка (dens axis), ямка зуба на передней дуге атланта (fovea dentis) и поперечная связка атланта (lig. transversum atlantis).",
            t: "Цилиндрический (articulatio trochoidea), одноосный.",
            m: "Вращение (rotatio) атланта вместе с черепом вокруг зуба — повороты головы вправо и влево.",
            g: "Крестообразная связка атланта (lig. cruciforme atlantis): поперечная связка и продольные пучки (fasciculi longitudinales); крыловидные связки (ligg. alaria); связка верхушки зуба (lig. apicis dentis); покровная мембрана (membrana tectoria).",
          }),
          J("Латеральный атлантоосевой сустав", "Articulatio atlantoaxialis lateralis", {
            s: "Нижние суставные ямки атланта (foveae articulares inferiores) и верхние суставные поверхности осевого позвонка (facies articulares superiores).",
            t: "Плоский (articulatio plana), парный, комбинированный со срединным.",
            m: "Скольжение при вращении атланта.",
          }),
        ],
      },
      {
        id: "spine",
        title: "Соединения позвоночного столба",
        note: "Диски, связки, дугоотростчатые суставы",
        items: [
          J("Межпозвоночный диск", "Discus intervertebralis", {
            d: "Соединяет тела позвонков — межпозвоночный симфиз (symphysis intervertebralis). Всего 23 диска, первый — между C II и C III, последний — между L V и крестцом. Наиболее толстые диски в поясничном отделе.",
            p: [
              "Anulus fibrosus — фиброзное кольцо (по периферии)",
              "Nucleus pulposus — студенистое ядро (в центре, амортизатор)",
            ],
          }),
          J("Продольные связки", "Ligg. longitudinalia", {
            p: [
              "Lig. longitudinale anterius — передняя продольная связка: по передней поверхности тел и дисков от затылочной кости до крестца; ограничивает разгибание",
              "Lig. longitudinale posterius — задняя продольная связка: по задней поверхности тел внутри позвоночного канала; ограничивает сгибание",
            ],
          }),
          J("Связки дуг и отростков", "Ligg. arcuum et processuum", {
            p: [
              "Ligg. flava — жёлтые связки (между дугами, эластические)",
              "Ligg. interspinalia — межостистые связки",
              "Lig. supraspinale — надостистая связка",
              "Lig. nuchae — выйная связка (в шейном отделе)",
              "Ligg. intertransversaria — межпоперечные связки",
            ],
          }),
          J("Дугоотростчатые суставы", "Articulationes zygapophysiales", {
            s: "Нижние суставные отростки (processus articulares inferiores) вышележащего позвонка и верхние суставные отростки (processus articulares superiores) нижележащего.",
            t: "Плоские (articulationes planae), малоподвижные, комбинированные.",
            m: "Скольжение; суммарно обеспечивают сгибание и разгибание, наклоны в стороны, вращение и круговое движение позвоночника. Наиболее подвижны шейный и поясничный отделы.",
          }),
          J("Пояснично-крестцовый сустав", "Articulatio lumbosacralis", {
            s: "V поясничный позвонок и основание крестца (basis ossis sacri): межпозвоночный диск и дугоотростчатые суставы.",
            g: "Подвздошно-поясничная связка (lig. iliolumbale).",
          }),
          J("Крестцово-копчиковый сустав", "Articulatio sacrococcygea", {
            s: "Верхушка крестца (apex ossis sacri) и I копчиковый позвонок.",
            m: "Отклонение копчика назад (у женщин при родах).",
            g: "Вентральная крестцово-копчиковая связка (lig. sacrococcygeum ventrale), поверхностная и глубокая дорсальные (lig. sacrococcygeum dorsale superficiale, lig. sacrococcygeum dorsale profundum), латеральная (lig. sacrococcygeum laterale).",
          }),
        ],
      },
      {
        id: "thorax",
        title: "Соединения грудной клетки",
        note: "Рёбра с позвонками и грудиной",
        items: [
          J("Сустав головки ребра", "Articulatio capitis costae", {
            s: "Головка ребра (caput costae) и рёберные ямки (foveae costales) тел двух соседних грудных позвонков; I, XI и XII рёбра — с одним позвонком.",
            t: "Комбинированный с рёберно-поперечным.",
            g: "Лучистая связка головки ребра (lig. capitis costae radiatum); внутрисуставная связка головки ребра (lig. capitis costae intraarticulare) — у II–X рёбер.",
          }),
          J("Рёберно-поперечный сустав", "Articulatio costotransversaria", {
            s: "Бугорок ребра (tuberculum costae) и рёберная ямка поперечного отростка (fovea costalis processus transversi). У XI и XII рёбер отсутствует.",
            t: "Вместе с суставом головки ребра образует комбинированный вращательный сустав.",
            m: "Вращение вокруг оси, идущей вдоль шейки ребра: передние концы рёбер поднимаются (вдох) и опускаются (выдох).",
            g: "Рёберно-поперечная связка (lig. costotransversarium).",
          }),
          J("Грудино-рёберные суставы", "Articulationes sternocostales", {
            s: "Хрящи II–VII рёбер (cartilagines costales) и рёберные вырезки грудины (incisurae costales). Хрящ I ребра срастается с грудиной — синхондроз (synchondrosis costae primae).",
            t: "Плоские, малоподвижные.",
            g: "Лучистые грудино-рёберные связки (ligg. sternocostalia radiata); спереди срастаются с надкостницей в мембрану грудины (membrana sterni).",
          }),
          J("Межхрящевые суставы", "Articulationes interchondrales", {
            s: "Между хрящами VI–IX рёбер. Хрящи VII–X рёбер образуют рёберную дугу (arcus costalis).",
          }),
        ],
      },
      {
        id: "upper-girdle",
        title: "Суставы пояса верхней конечности",
        note: "Грудино-ключичный, акромиально-ключичный",
        items: [
          J("Грудино-ключичный сустав", "Articulatio sternoclavicularis", {
            s: "Грудинный конец ключицы (extremitas sternalis claviculae) и ключичная вырезка рукоятки грудины (incisura clavicularis). Внутри — суставной диск (discus articularis).",
            t: "Седловидный по форме (articulatio sellaris), комплексный; благодаря диску по объёму движений приближается к шаровидному.",
            m: "Поднимание и опускание ключицы; движение вперёд и назад; вращение вокруг своей оси; круговое движение.",
            g: "Передняя и задняя грудино-ключичные связки (lig. sternoclaviculare anterius, lig. sternoclaviculare posterius), межключичная связка (lig. interclaviculare), рёберно-ключичная связка (lig. costoclaviculare).",
          }),
          J("Акромиально-ключичный сустав", "Articulatio acromioclavicularis", {
            s: "Акромиальный конец ключицы (extremitas acromialis claviculae) и суставная поверхность акромиона (facies articularis acromii).",
            t: "Плоский (articulatio plana), многоосный, малоподвижный.",
            m: "Небольшие смещения лопатки относительно ключицы.",
            g: "Акромиально-ключичная связка (lig. acromioclaviculare); клювовидно-ключичная связка (lig. coracoclaviculare) из двух частей: трапециевидной (lig. trapezoideum) и конической (lig. conoideum).",
          }),
          J("Собственные связки лопатки", "Ligamenta scapulae", {
            p: [
              "Lig. coracoacromiale — клювовидно-акромиальная связка: образует свод плечевого сустава, ограничивает отведение плеча выше горизонтали",
              "Lig. transversum scapulae superius — верхняя поперечная связка лопатки (над вырезкой лопатки)",
              "Lig. transversum scapulae inferius — нижняя поперечная связка лопатки",
            ],
          }),
        ],
      },
      {
        id: "upper-free",
        title: "Суставы свободной верхней конечности",
        note: "Плечевой, локтевой, лучезапястный, суставы кисти",
        items: [
          J("Плечевой сустав", "Articulatio humeri", {
            s: "Головка плечевой кости (caput humeri) и суставная впадина лопатки (cavitas glenoidalis), дополненная суставной губой (labrum glenoidale).",
            t: "Шаровидный (articulatio spheroidea), простой, многоосный. Самый подвижный сустав тела.",
            m: "Сгибание и разгибание (flexio, extensio); отведение и приведение (abductio, adductio) — отведение выше горизонтали происходит вместе с лопаткой; вращение (rotatio); круговое движение (circumductio).",
            g: "Клювовидно-плечевая связка (lig. coracohumerale); суставно-плечевые связки (ligg. glenohumeralia) — в толще капсулы. Через полость сустава проходит сухожилие длинной головки двуглавой мышцы плеча (caput longum m. bicipitis brachii).",
            d: "Капсула тонкая и свободная, связочный аппарат слабый — сустав удерживают в основном мышцы, поэтому здесь часты вывихи.",
          }),
          J("Локтевой сустав", "Articulatio cubiti", {
            s: "Три сустава в общей капсуле. Плечелоктевой (art. humeroulnaris): блок плечевой кости (trochlea humeri) и блоковидная вырезка локтевой кости (incisura trochlearis). Плечелучевой (art. humeroradialis): головка мыщелка плечевой кости (capitulum humeri) и суставная ямка головки лучевой кости (fovea articularis capitis radii). Проксимальный луче-локтевой (art. radioulnaris proximalis): суставная окружность головки лучевой кости (circumferentia articularis radii) и лучевая вырезка локтевой кости (incisura radialis ulnae).",
            t: "Сложный (articulatio composita). Плечелоктевой — блоковидный (винтообразный), плечелучевой — шаровидный, проксимальный луче-локтевой — цилиндрический.",
            m: "Сгибание и разгибание предплечья; пронация и супинация (pronatio, supinatio) — вместе с дистальным луче-локтевым суставом.",
            g: "Локтевая коллатеральная связка (lig. collaterale ulnare), лучевая коллатеральная связка (lig. collaterale radiale), кольцевая связка лучевой кости (lig. anulare radii), квадратная связка (lig. quadratum).",
          }),
          J("Дистальный луче-локтевой сустав", "Articulatio radioulnaris distalis", {
            s: "Суставная окружность головки локтевой кости (circumferentia articularis ulnae) и локтевая вырезка лучевой кости (incisura ulnaris radii). Суставной диск (discus articularis) отделяет его от лучезапястного сустава.",
            t: "Цилиндрический (articulatio trochoidea), комбинированный с проксимальным луче-локтевым.",
            m: "Пронация и супинация: лучевая кость вращается вокруг локтевой вместе с кистью.",
            g: "Межкостная перепонка предплечья (membrana interossea antebrachii) — синдесмоз между костями предплечья.",
          }),
          J("Лучезапястный сустав", "Articulatio radiocarpalis", {
            s: "Запястная суставная поверхность лучевой кости (facies articularis carpalis radii) и суставной диск (discus articularis) со стороны локтевой кости — с проксимальным рядом костей запястья: ладьевидной (os scaphoideum), полулунной (os lunatum) и трёхгранной (os triquetrum).",
            t: "Эллипсоидный (articulatio ellipsoidea), сложный, двуосный.",
            m: "Сгибание и разгибание кисти; отведение и приведение; круговое движение.",
            g: "Лучевая коллатеральная связка запястья (lig. collaterale carpi radiale), локтевая коллатеральная связка запястья (lig. collaterale carpi ulnare), ладонная лучезапястная связка (lig. radiocarpale palmare), тыльная лучезапястная связка (lig. radiocarpale dorsale).",
          }),
          J("Среднезапястный и межзапястные суставы", "Articulatio mediocarpalis, articulationes intercarpales", {
            s: "Среднезапястный — между проксимальным и дистальным рядами костей запястья (S-образная щель); межзапястные — между соседними костями одного ряда. Отдельно — сустав гороховидной кости (art. ossis pisiformis).",
            t: "Функционально связаны с лучезапястным суставом, малоподвижны.",
            g: "Лучистая связка запястья (lig. carpi radiatum); ладонные, тыльные и межкостные межзапястные связки (ligg. intercarpalia palmaria, ligg. intercarpalia dorsalia, ligg. intercarpalia interossea).",
          }),
          J("Запястно-пястный сустав большого пальца", "Articulatio carpometacarpalis pollicis", {
            s: "Кость-трапеция (os trapezium) и основание I пястной кости (basis ossis metacarpi I).",
            t: "Седловидный (articulatio sellaris), двуосный, обособлен от остальных запястно-пястных суставов.",
            m: "Противопоставление (oppositio) и обратное движение (repositio); отведение и приведение; круговое движение.",
          }),
          J("Запястно-пястные суставы II–V", "Articulationes carpometacarpales", {
            s: "Дистальный ряд костей запястья и основания II–V пястных костей (bases ossium metacarpi).",
            t: "Плоские (articulationes planae), малоподвижные — твёрдая основа кисти.",
            g: "Ладонные запястно-пястные связки (ligg. carpometacarpalia palmaria), тыльные запястно-пястные связки (ligg. carpometacarpalia dorsalia).",
          }),
          J("Пястно-фаланговые суставы", "Articulationes metacarpophalangeae", {
            s: "Головки пястных костей (capita ossium metacarpi) и основания проксимальных фаланг (bases phalangium proximalium).",
            t: "II–V — эллипсоидные (по форме поверхностей шаровидные); I — блоковидный.",
            m: "Сгибание и разгибание; отведение и приведение пальцев; круговое движение.",
            g: "Коллатеральные связки (ligg. collateralia), ладонные связки (ligg. palmaria), глубокая поперечная пястная связка (lig. metacarpale transversum profundum).",
          }),
          J("Межфаланговые суставы кисти", "Articulationes interphalangeae manus", {
            s: "Головка (caput phalangis) и основание (basis phalangis) соседних фаланг.",
            t: "Блоковидные (ginglymus), одноосные.",
            m: "Сгибание и разгибание.",
            g: "Коллатеральные связки (ligg. collateralia), ладонные связки (ligg. palmaria).",
          }),
        ],
      },
      {
        id: "pelvis",
        title: "Соединения таза",
        note: "Крестцово-подвздошный сустав, симфиз, связки",
        items: [
          J("Крестцово-подвздошный сустав", "Articulatio sacroiliaca", {
            s: "Ушковидные поверхности (facies auriculares) крестца и подвздошной кости.",
            t: "Плоский, тугой (amphiarthrosis) — движения практически отсутствуют.",
            g: "Передние крестцово-подвздошные связки (ligg. sacroiliaca anteriora), межкостные (ligg. sacroiliaca interossea, самые прочные), задние (ligg. sacroiliaca posteriora); подвздошно-поясничная связка (lig. iliolumbale).",
          }),
          J("Лобковый симфиз", "Symphysis pubica", {
            s: "Симфизиальные поверхности лобковых костей (facies symphysiales), между ними — межлобковый диск (discus interpubicus) с узкой щелью.",
            t: "Полусустав (symphysis).",
            g: "Верхняя лобковая связка (lig. pubicum superius), дугообразная связка лобка (lig. arcuatum pubis).",
          }),
          J("Собственные связки таза", "Ligamenta pelvis", {
            p: [
              "Lig. sacrotuberale — крестцово-бугорная связка (от крестца и копчика к седалищному бугру)",
              "Lig. sacrospinale — крестцово-остистая связка (к седалищной ости)",
              "Foramen ischiadicum majus — большое седалищное отверстие (грушевидная мышца, седалищный нерв, сосуды)",
              "Foramen ischiadicum minus — малое седалищное отверстие (внутренняя запирательная мышца)",
              "Membrana obturatoria — запирательная мембрана",
              "Canalis obturatorius — запирательный канал (запирательные сосуды и нерв)",
            ],
          }),
        ],
      },
      {
        id: "lower-free",
        title: "Суставы свободной нижней конечности",
        note: "Тазобедренный, коленный, голеностопный, суставы стопы",
        items: [
          J("Тазобедренный сустав", "Articulatio coxae", {
            s: "Полулунная поверхность вертлужной впадины (facies lunata acetabuli) и головка бедренной кости (caput femoris). Впадину углубляет вертлужная губа (labrum acetabulare), над вырезкой перекинута поперечная связка вертлужной впадины (lig. transversum acetabuli).",
            t: "Чашеобразный (articulatio cotylica) — разновидность шаровидного; простой, многоосный.",
            m: "Сгибание и разгибание; отведение и приведение; вращение; круговое движение. Объём меньше, чем в плечевом, — выше устойчивость.",
            g: "Внекапсульные: подвздошно-бедренная связка (lig. iliofemorale) — самая прочная связка тела, тормозит разгибание; лобково-бедренная (lig. pubofemorale); седалищно-бедренная (lig. ischiofemorale); круговая зона (zona orbicularis). Внутрисуставная: связка головки бедренной кости (lig. capitis femoris) — несёт сосуды к головке.",
          }),
          J("Коленный сустав", "Articulatio genus", {
            s: "Мыщелки бедренной кости (condyli femoris), верхняя суставная поверхность большеберцовой кости (facies articularis superior tibiae) и надколенник (patella). Между бедренной и большеберцовой костями — мениски: медиальный (meniscus medialis, C-образный) и латеральный (meniscus lateralis, почти кольцевидный); спереди их соединяет поперечная связка колена (lig. transversum genus).",
            t: "Мыщелковый (articulatio bicondylaris), сложный, комплексный. Самый крупный сустав тела.",
            m: "Сгибание и разгибание голени; при согнутом колене — вращение голени.",
            g: "Внутрисуставные: передняя крестообразная связка (lig. cruciatum anterius), задняя крестообразная связка (lig. cruciatum posterius). Внесуставные: большеберцовая коллатеральная (lig. collaterale tibiale), малоберцовая коллатеральная (lig. collaterale fibulare), связка надколенника (lig. patellae), косая подколенная (lig. popliteum obliquum), дугообразная подколенная (lig. popliteum arcuatum).",
            d: "Синовиальные сумки: наднадколенниковая (bursa suprapatellaris, сообщается с полостью сустава), подкожная преднадколенниковая (bursa subcutanea prepatellaris), глубокая поднадколенниковая (bursa infrapatellaris profunda). Крыловидные складки (plicae alares) содержат жировую ткань.",
          }),
          J("Соединения костей голени", "Juncturae ossium cruris", {
            p: [
              "Articulatio tibiofibularis — межберцовый сустав (проксимально): плоский, малоподвижный",
              "Membrana interossea cruris — межкостная перепонка голени",
              "Syndesmosis tibiofibularis — межберцовый синдесмоз (дистально)",
              "Lig. tibiofibulare anterius, lig. tibiofibulare posterius — передняя и задняя межберцовые связки",
            ],
          }),
          J("Голеностопный сустав", "Articulatio talocruralis", {
            s: "Нижняя суставная поверхность большеберцовой кости (facies articularis inferior tibiae) и суставные поверхности обеих лодыжек (malleolus medialis, malleolus lateralis) образуют «вилку», охватывающую блок таранной кости (trochlea tali).",
            t: "Блоковидный (ginglymus), сложный, одноосный.",
            m: "Тыльное сгибание (разгибание) и подошвенное сгибание стопы. При подошвенном сгибании возможны небольшие боковые движения.",
            g: "Медиально: медиальная, или дельтовидная, связка (lig. mediale, lig. deltoideum). Латерально: передняя таранно-малоберцовая (lig. talofibulare anterius), задняя таранно-малоберцовая (lig. talofibulare posterius), пяточно-малоберцовая (lig. calcaneofibulare).",
          }),
          J("Подтаранный сустав", "Articulatio subtalaris", {
            s: "Задняя пяточная суставная поверхность таранной кости (facies articularis calcanea posterior) и задняя таранная суставная поверхность пяточной кости (facies articularis talaris posterior).",
            t: "Цилиндрический; комбинированный с таранно-пяточно-ладьевидным.",
            m: "Пронация и супинация стопы.",
            g: "Межкостная таранно-пяточная связка (lig. talocalcaneum interosseum) — в пазухе предплюсны (sinus tarsi); латеральная и медиальная таранно-пяточные связки (lig. talocalcaneum laterale, lig. talocalcaneum mediale).",
          }),
          J("Таранно-пяточно-ладьевидный сустав", "Articulatio talocalcaneonavicularis", {
            s: "Головка таранной кости (caput tali), ладьевидная кость (os naviculare) и передняя часть пяточной кости (calcaneus).",
            t: "Шаровидный по форме; функционирует вместе с подтаранным вокруг одной оси.",
            m: "Пронация (поднимание латерального края стопы) и супинация (поднимание медиального края).",
            g: "Подошвенная пяточно-ладьевидная связка (lig. calcaneonaviculare plantare) — поддерживает головку таранной кости; таранно-ладьевидная связка (lig. talonaviculare).",
          }),
          J("Поперечный сустав предплюсны (Шопара)", "Articulatio tarsi transversa", {
            s: "Объединяет два сустава: таранно-ладьевидный (art. talonavicularis) и пяточно-кубовидный (art. calcaneocuboidea). Суставная щель S-образная.",
            g: "Раздвоенная связка (lig. bifurcatum) — «ключ шопарова сустава»: пяточно-ладьевидная (lig. calcaneonaviculare) и пяточно-кубовидная (lig. calcaneocuboideum) связки.",
          }),
          J("Предплюсне-плюсневые суставы (Лисфранка)", "Articulationes tarsometatarsales", {
            s: "Кубовидная кость (os cuboideum) и три клиновидные кости (ossa cuneiformia) — с основаниями плюсневых костей (bases ossium metatarsi).",
            t: "Плоские (articulationes planae), малоподвижные.",
            g: "Тыльные и подошвенные предплюсне-плюсневые связки (ligg. tarsometatarsalia dorsalia, ligg. tarsometatarsalia plantaria); межкостные клиноплюсневые связки (ligg. cuneometatarsalia interossea) — медиальная из них считается «ключом лисфранкова сустава».",
          }),
          J("Плюснефаланговые и межфаланговые суставы", "Articulationes metatarsophalangeae et interphalangeae pedis", {
            s: "Головки плюсневых костей (capita ossium metatarsi) и основания проксимальных фаланг; головки и основания соседних фаланг.",
            t: "Плюснефаланговые — эллипсоидные; межфаланговые — блоковидные.",
            m: "Сгибание и разгибание пальцев; в плюснефаланговых — небольшое отведение и приведение.",
            g: "Коллатеральные связки (ligg. collateralia), подошвенные связки (ligg. plantaria), глубокая поперечная плюсневая связка (lig. metatarsale transversum profundum).",
          }),
          J("Своды стопы", "Arcus pedis", {
            d: "Стопа опирается на пяточный бугор и головки плюсневых костей. Различают пять продольных сводов (наиболее высокий — второй) и поперечный свод. Уплощение сводов — плоскостопие.",
            p: [
              "Arcus pedis longitudinalis — продольный свод стопы; arcus pedis transversus — поперечный свод стопы",
              "Пассивные «затяжки»: lig. plantare longum (длинная подошвенная связка), lig. calcaneonaviculare plantare (подошвенная пяточно-ладьевидная связка), aponeurosis plantaris (подошвенный апоневроз)",
              "Активные «затяжки» продольного свода: мышцы-сгибатели голени и стопы, m. tibialis posterior (задняя большеберцовая мышца)",
              "Активные «затяжки» поперечного свода: m. peroneus longus (длинная малоберцовая мышца), m. adductor hallucis (мышца, приводящая большой палец стопы)",
            ],
          }),
        ],
      },
    ],
  });
})();
