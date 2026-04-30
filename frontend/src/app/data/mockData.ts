export interface Manga {
  id: string;
  title: string;
  originalTitle?: string;
  coverImage: string;
  author: string;
  rating: number;
  chapters: number;
  genres: string[];
  description: string;
  status: string;
  format: string;
  lastUpdated: string;
  tags: string[];
  team?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  views: number;
}

export const mockMangaList: Manga[] = [
  {
    id: "1",
    title: "Володар Тіней",
    coverImage: "https://i.pinimg.com/1200x/2c/3d/94/2c3d94ea8f5c9446c7e7d8e0f0ca401d.jpg",
    author: "Кім Сон Хі",
    rating: 9.6,
    chapters: 284,
    genres: ["Фентезі", "Бойовик", "Драма"],
    description: "Історія про юнака, який повертається в часі після смерті та отримує силу керувати тінями. Він вирушає у подорож, щоб змінити своє майбутнє...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-24",
    tags: ["фентезі", "бойовик", "драма", "повернення-в-часі"]
  },
  {
    id: "2",
    title: "Світанок Героїв",
    coverImage: "https://blacknerdproblems.com/wp-content/uploads/2024/05/rivers-edge-714x1024.jpg",
    author: "Лі Мін Джун",
    rating: 8.6,
    chapters: 156,
    genres: ["Пригоди", "Фентезі"],
    description: "У світі, де люди народжуються з магічними здібностями, один хлопець без жодної сили намагається стати найсильнішим героєм...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-23",
    tags: ["фентезі", "пригоди", "магія"]
  },
  {
    id: "3",
    title: "Меч і Корона",
    coverImage: "https://i.pinimg.com/736x/0a/8b/92/0a8b92342d65e5fe6a63ac4bc5a9aa19.jpg",
    author: "Парк Джі Хун",
    rating: 9.9,
    chapters: 198,
    genres: ["Історичне", "Романтика", "Драма"],
    description: "Принцеса, яка прикидається рицарем, та принц, який ховає свою особу під маскою. Їхні долі переплітаються у вирі інтриг...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-24",
    tags: ["історичне", "романтика", "драма"]
  },
  {
    id: "4",
    title: "Кулінарний Шлях",
    coverImage: "https://i.pinimg.com/736x/48/ce/f5/48cef584146d541ec3898b6238213180.jpg",
    author: "Чон Мі Ра",
    rating: 9.0,
    chapters: 89,
    genres: ["Повсякденність", "Кулінарія"],
    description: "Молодий кухар відкриває невеликий ресторан та створює страви, які зцілюють душі людей. Кожне блюдо несе особливу історію...",
    status: "Триває",
    format: "Веб-комікс",
    lastUpdated: "2026-03-22",
    tags: ["повсякденність", "кулінарія", "комедія"]
  },
  {
    id: "5",
    title: "Темна Академія",
    coverImage: "https://i.pinimg.com/736x/54/7e/22/547e222b9f10827c7233912f9ffb6f80.jpg",
    author: "Хван Со Юн",
    rating: 4.7,
    chapters: 134,
    genres: ["Містика", "Трилер", "Надприродне"],
    description: "В елітній академії магії студенти зникають один за одним. Група учнів вирішує розслідувати таємниці, приховані в стінах школи...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-25",
    tags: ["містика", "трилер", "надприродне", "школа"]
  },
  {
    id: "6",
    title: "Останній Некромант",
    coverImage: "https://i.pinimg.com/736x/0b/13/0b/0b130b36b2a8aa633eb19e0e94981760.jpg",
    author: "Кім Тей Хун",
    rating: 4.8,
    chapters: 223,
    genres: ["Фентезі", "Бойовик"],
    description: "У світі, де некромантія заборонена, останній некромант бореться за виживання та шукає відповіді про загибель свого клану...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-24",
    tags: ["фентезі", "бойовик", "магія", "некромантія"]
  },
  {
    id: "7",
    title: "Зоряні Мандрівники",
    coverImage: "https://i.pinimg.com/736x/34/87/85/3487852031f39b3832b58b87a6c7fb0a.jpg",
    author: "Лі Джин А",
    rating: 4.4,
    chapters: 67,
    genres: ["Наукова фантастика", "Пригоди"],
    description: "Команда дослідників подорожує космосом у пошуках нового дому для людства. На своєму шляху вони стикаються з невідомими цивілізаціями...",
    status: "Триває",
    format: "Веб-комікс",
    lastUpdated: "2026-03-23",
    tags: ["sci-fi", "пригоди", "космос"]
  },
  {
    id: "8",
    title: "Серце Драконів",
    coverImage: "https://i.pinimg.com/736x/07/e0/91/07e091588266c8729b256df5d6d85219.jpg",
    author: "Юн Хе Мін",
    rating: 4.9,
    chapters: 178,
    genres: ["Фентезі", "Романтика"],
    description: "Дівчина виявляє, що вона — нащадок давнього роду вершників драконів. Її доля переплітається з таємничим принцом драконів...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-25",
    tags: ["фентезі", "романтика", "дракони"]
  },
  {
    id: "9",
    title: "Міська Легенда",
    coverImage: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=300&h=400&fit=crop",
    author: "Сон Джи Ву",
    rating: 4.3,
    chapters: 45,
    genres: ["Жахи", "Містика"],
    description: "Студентка починає бачити духів після аварії. Вона виявляє, що кожен дух має незавершену справу, і тільки вона може їм допомогти...",
    status: "Триває",
    format: "Веб-комікс",
    lastUpdated: "2026-03-22",
    tags: ["жахи", "містика", "духи", "надприродне"]
  },
  {
    id: "10",
    title: "Майстер Лука",
    coverImage: "https://i.pinimg.com/736x/59/e3/82/59e382bc7df95a4957e61b21248f23ae.jpg",
    author: "Бек Чан Мін",
    rating: 4.7,
    chapters: 112,
    genres: ["Бойовик", "Бойові мистецтва"],
    description: "Майстер стрільби з лука повертається після 10 років усамітнення, щоб помститися тим, хто знищив його сім'ю...",
    status: "Триває",
    format: "Манхва",
    lastUpdated: "2026-03-24",
    tags: ["бойовик", "помста", "бойові-мистецтва"]
  }
];

export const generateMockChapters = (totalChapters: number): Chapter[] => {
  return Array.from({ length: totalChapters }, (_, i) => ({
    id: `chapter-${i + 1}`,
    number: i + 1,
    title: `Розділ ${i + 1}`,
    releaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    views: Math.floor(Math.random() * 50000) + 1000
  })).reverse();
};

export const tags = {
  genres: [
    "Бойовик", "Пригоди", "Комедія", "Драма", "Фентезі", "Жахи", 
    "Містика", "Романтика", "Наукова фантастика", "Трилер", 
    "Історичне", "Повсякденність", "Психологічне"
  ],
  themes: [
    "Школа", "Магія", "Дракони", "Помста", "Подорож у часі", 
    "Надприродне", "Війна", "Інтриги", "Виживання", "Дружба",
    "Сім'я", "Кохання", "Самовдосконалення"
  ],
  formats: [
    "Манга", "Манхва", "Маньхуа", "Веб-комікс", "Дуджінші"
  ]
};

export const mockComments = [
  {
    id: "1",
    author: "olexandr",
    avatar: "https://i.pinimg.com/1200x/e6/23/84/e6238482f5b711ea0fe0b46fe8f511d5.jpg",
    content: "Неймовірний розділ! Не можу дочекатися наступного!",
    timestamp: "2 години тому",
    likes: 24,
    deleted: false,
    replies: [
      {
        id: "1-1",
        author: "puuurrrrrr",
        avatar: "https://i.pinimg.com/1200x/95/91/0a/95910a83770f5f5f17080c189d638a4c.jpg",
        content: "Повністю згодна! Сюжет стає все цікавішим.",
        timestamp: "1 година тому",
        likes: 8,
        deleted: false,
        replies: [
          {
            id: "1-1-1",
            author: "eViL_BuNnY",
            avatar: "https://i.pinimg.com/1200x/da/0a/a6/da0aa6aa60720d7f5cf3ff002f07d2ff.jpg",
            content: "Чекаю на битву в наступному розділі!",
            timestamp: "30 хвилин тому",
            likes: 3,
            deleted: false,
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: "2",
    author: "anna",
    avatar: "https://i.pinimg.com/736x/71/c5/2b/71c52bd601dd55c8f82daf440289a2ec.jpg",
    content: "Художник просто талановитий! Кожна панель — витвір мистецтва.",
    timestamp: "3 години тому",
    likes: 45,
    deleted: false,
    replies: [
      {
        id: "2-1",
        author: "ihnore_ihor",
        avatar: "https://i.pinimg.com/736x/d9/df/b1/d9dfb178d24b4da545af08e8d31bcc34.jpg",
        content: "Згоден! Особливо сцена на останній сторінці.",
        timestamp: "2 години тому",
        likes: 12,
        deleted: false,
        replies: []
      }
    ]
  },
  {
    id: "3",
    author: "maria_k",
    avatar: "https://i.pinimg.com/736x/45/65/23/456523a9e8c5f0e7d2b3a4f5c6d7e8f9.jpg",
    content: "",
    timestamp: "6 годин тому",
    likes: 15,
    deleted: true,
    replies: [
      {
        id: "3-1",
        author: "kuroo_67",
        avatar: "https://i.pinimg.com/736x/89/b7/45/89b745e607432fd8203374ebf91bc432.jpg",
        content: "Так! Я думаю, що таємничий персонаж з розділу 15 нарешті з'явиться!",
        timestamp: "4 години тому",
        likes: 23,
        deleted: false,
        replies: []
      },
      {
        id: "3-2",
        author: "eViL_BuNnY",
        avatar: "https://i.pinimg.com/1200x/da/0a/a6/da0aa6aa60720d7f5cf3ff002f07d2ff.jpg",
        content: "Цікава теорія! Не можу дочекатися перевірити.",
        timestamp: "3 години тому",
        likes: 8,
        deleted: false,
        replies: []
      }
    ]
  },
  {
    id: "4",
    author: "ihnore_ihor",
    avatar: "https://i.pinimg.com/736x/d9/df/b1/d9dfb178d24b4da545af08e8d31bcc34.jpg",
    content: "Хтось помітив натяк на минулу арку? Все починає складатися!",
    timestamp: "5 годин тому",
    likes: 67,
    deleted: false,
    replies: []
  }
];