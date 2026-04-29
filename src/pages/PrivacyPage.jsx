// Path: src/pages/PrivacyPage.jsx
import { useNavigate } from 'react-router-dom'
import { languages } from '../i18n/translations.js'
import { useI18n } from '../i18n/useI18n.js'

const policyTextRu = `# Политика конфиденциальности OtanAI

1. Общие положения

1.1. Настоящая Политика конфиденциальности (далее — «Политика») описывает, какие данные собираются и обрабатываются при использовании приложения OtanAI (далее — «Сервис»), а также цели и условия их обработки.

1.2. Оператором данных является ИП Goldman, адрес: Республика Казахстан, г. Астана. Контакт для вопросов по данным: yeskendiriskakov@gmail.com. Сайт: https://otanai.kz.

1.3. Используя Сервис, пользователь подтверждает, что ознакомился с Политикой и соглашается с её условиями.

2. Какие данные мы собираем

2.1. Данные аккаунта

Мы можем собирать данные, необходимые для регистрации и входа: адрес электронной почты, имя (если указано), номер телефона (если используется), а также данные входа через Apple/Google (идентификатор и базовые сведения, которые вы разрешили передать).

2.2. Идентификаторы

Мы можем обрабатывать технические идентификаторы, такие как Firebase UID, RevenueCat AppUserID и идентификаторы устройства/приложения, необходимые для работы аутентификации, подписок и безопасности.

2.3. Пользовательский контент

Сервис обрабатывает пользовательский контент, который вы отправляете в чат: текстовые сообщения, изображения, файлы и иные вложения. Такой контент может храниться в базе данных и/или облачном хранилище (например, Firestore/Storage) для обеспечения функциональности Сервиса.

2.4. Технические данные

Мы можем собирать технические данные, необходимые для стабильной работы и улучшения качества: логи ошибок, данные об использовании функций, сведения о производительности. Если аналитика подключена, она используется в обобщенном виде и не предназначена для прямой идентификации личности без необходимости.

3. Как мы используем данные

3.1. Для предоставления работы Сервиса: создание и управление аккаунтом, хранение истории диалогов, обработка сообщений, синхронизация данных между устройствами.

3.2. Для обеспечения качества и безопасности: выявление ошибок, предотвращение злоупотреблений, улучшение производительности.

3.3. Для улучшения работы AI-ответов и функциональности: ваши сообщения и контент могут быть обработаны для улучшения качества сервиса и моделей, если это предусмотрено продуктовой логикой OtanAI и не противоречит применимому праву.

3.4. Для обработки оплат и подписок: сведения, необходимые для управления подпиской через App Store/RevenueCat, включая статус подписки и технические идентификаторы.

4. AI-контент и пользовательский контент

4.1. Пользователь самостоятельно предоставляет в чат тексты, файлы и изображения. Эти данные могут обрабатываться с использованием AI-моделей для генерации ответов.

4.2. Запрещено отправлять в Сервис:

- паспортные и иные идентификационные документы;
- данные банковских карт, пароли и секретные коды;
- медицинскую тайну, сведения о здоровье или диагнозах, если это не предусмотрено специальным режимом работы сервиса;
- иные чувствительные данные, разглашение которых может причинить вред.

4.3. AI-ответы формируются автоматически и могут быть неточными. Они не являются профессиональной медицинской, юридической, финансовой или иной консультацией.

5. Передача данных третьим лицам

5.1. Мы можем передавать данные поставщикам инфраструктуры и сервисов, необходимым для работы приложения:

- Firebase (Google) — аутентификация, база данных, хранилище;
- RevenueCat — управление подписками и биллингом;
- другие сервисы, которые используются строго по необходимости.

5.2. Мы не продаём персональные данные третьим лицам для маркетинговых целей без явного согласия пользователя.

6. Хранение и защита данных

6.1. Данные хранятся на серверах и в облачной инфраструктуре, используемой OtanAI и его поставщиками (например, Google Cloud/Firebase). География хранения может включать страны вне вашего места проживания.

6.2. Мы применяем разумные технические и организационные меры безопасности: контроль доступа, шифрование в пути передачи данных, ограничение прав доступа, мониторинг и резервное копирование.

7. Срок хранения данных

7.1. Данные хранятся столько, сколько необходимо для предоставления Сервиса и выполнения обязательств перед пользователем, либо до отзыва согласия/удаления аккаунта, если иное не требуется законом.

8. Права пользователя

8.1. Пользователь имеет право получить доступ к своим данным, запросить исправление или удаление.

8.2. Удаление аккаунта может быть доступно через приложение (если реализовано) либо по запросу в поддержку: yeskendiriskakov@gmail.com.

9. Дети

9.1. Сервис не предназначен для лиц младше 18 лет. Возрастной порог может быть изменен в зависимости от требований законодательства и настройки продукта.

10. Контакты

10.1. По вопросам обработки данных можно обратиться по адресу: yeskendiriskakov@gmail.com.

11. Изменения политики

11.1. Мы можем обновлять Политику. Новая редакция вступает в силу с момента публикации в приложении и/или на сайте: https://otanai.kz.
`

const policyTextKk = `# OtanAI құпиялық саясаты

1. Жалпы ережелер

1.1. Бұл саясат OtanAI сервисі қандай деректерді жинайтынын, оларды қалай қолданатынын, сақтайтынын және қорғайтынын түсіндіреді.

1.2. Деректер операторы: ИП Goldman, Қазақстан Республикасы, Астана қаласы. Байланыс: yeskendiriskakov@gmail.com.

2. Біз қандай деректерді жинаймыз

2.1. Аккаунт деректері: email, аты, телефон нөмірі, Apple/Google арқылы кіру идентификаторлары.

2.2. Техникалық идентификаторлар: Firebase UID, RevenueCat AppUserID және сервис жұмысына қажет құрылғы/қолданба идентификаторлары.

2.3. Чатқа жіберілген мәтіндер, файлдар, суреттер және басқа пайдаланушы контенті.

2.4. Қате логтары, функцияларды қолдану деректері және өнім сапасын жақсартуға қажет техникалық ақпарат.

3. Деректерді қалай қолданамыз

3.1. Аккаунтты жүргізу, чат тарихын сақтау, хабарламаларды өңдеу және құрылғылар арасында синхрондау үшін.

3.2. Қауіпсіздік, қателерді анықтау, өнім сапасын жақсарту және теріс пайдалануды болдырмау үшін.

3.3. Жазылым мен төлемдерді басқару үшін.

4. AI және пайдаланушы контенті

4.1. AI жауаптарын жасау үшін сұраудағы мәтін және қажет техникалық деректер өңделуі мүмкін.

4.2. Паспорт, банк картасы, құпиясөз, медициналық құпия немесе басқа сезімтал деректерді чатқа жібермеуді сұраймыз.

4.3. AI жауаптары автоматты түрде жасалады және кәсіби медициналық, заңдық немесе қаржылық кеңес болып саналмайды.

5. Үшінші тараптарға беру

5.1. Деректер Firebase/Google, RevenueCat және сервис жұмысына қажет басқа провайдерлер арқылы өңделуі мүмкін.

5.2. Біз жеке деректерді маркетинг мақсатында үшінші тараптарға сатпаймыз.

6. Сақтау және қорғау

6.1. Деректер сервис көрсетуге қажет мерзім ішінде немесе заң талап еткен уақытқа дейін сақталады.

6.2. Біз қолжетімді техникалық және ұйымдастырушылық қауіпсіздік шараларын қолданамыз.

7. Пайдаланушы құқықтары

7.1. Сіз деректеріңізге қол жеткізу, түзету немесе өшіру туралы сұрау жібере аласыз.

7.2. Аккаунтты өшіру қолданба ішінде немесе қолдау қызметі арқылы сұралуы мүмкін: yeskendiriskakov@gmail.com.

8. Балалар

8.1. Сервис 18 жасқа толмаған тұлғаларға арналмаған.

9. Байланыс

9.1. Деректерді өңдеу сұрақтары бойынша: yeskendiriskakov@gmail.com.

10. Өзгерістер

10.1. Саясат жаңартылуы мүмкін. Жаңа нұсқа қолданбада немесе https://otanai.kz сайтында жарияланған сәттен бастап күшіне енеді.
`

const policyTextEn = `# OtanAI Privacy Policy

1. General Provisions

1.1. This Privacy Policy (the "Policy") explains what information OtanAI collects, how OtanAI uses, stores, transfers, and shares that information, and what choices and rights you have when you use the OtanAI application and related services (the "Service").

1.2. The data controller for the Service is Goldman, an individual entrepreneur located in Astana, Republic of Kazakhstan. Contact: yeskendiriskakov@gmail.com.

1.3. By creating an account, accessing, or using the Service, you acknowledge that you have read this Policy.

1.4. Certain features of the Service use artificial intelligence ("AI") tools. Before any data is sent from the app to AI data processors, the app requests your permission through an in-app consent screen.

2. What Data We Collect

2.1. Account Data
We may collect account and profile information that you provide or authorize us to receive, including your email address, name, phone number if provided, and sign-in information associated with Apple Sign-In or Google Sign-In.

2.2. Identifiers
We may collect or generate identifiers needed to operate the Service, including Firebase user ID, RevenueCat App User ID, device or app instance identifiers, and similar identifiers used for authentication, subscription management, fraud prevention, security, and service reliability.

2.3. User Content
We collect and process content that you choose to submit through the Service, including chat messages, prompts, uploaded files, uploaded images, attachments, and other content you provide in connection with app features.

2.4. AI-Related Content
If you use AI features, we may process the specific data required to fulfill your request, including message text, prompts, extracted user preferences/facts to maintain chat context, uploaded files, uploaded images, attachments, language settings, and limited technical metadata required to process AI requests and deliver responses.

2.5. Technical, App, and Device Information
We may collect technical and diagnostic information about your use of the Service, such as app version, device type, operating system information, crash data, performance data, usage events, request diagnostics, and limited metadata needed to maintain, secure, and improve the Service.

2.6. Subscription and Billing Data
We may process information related to subscriptions, entitlements, billing state, and purchase restoration status through the App Store, RevenueCat, and related systems. We do not receive your full payment card details from Apple.

3. How Data Is Collected

3.1. We collect data when you create an account, sign in, manage your profile, or otherwise use account features.

3.2. We collect data when you use AI chat or other AI-powered features, including when you type messages, submit prompts, or request AI-generated responses.

3.3. We collect data when you upload files, images, or other attachments for processing within the Service.

3.4. We collect data when you use app functionality generally, including subscription, settings, support, and content features.

3.5. We collect technical events, diagnostics, and subscription-related events automatically when necessary to operate the Service, process purchases, maintain security, investigate abuse, and support reliability.

4. How We Use Data

4.1. To provide the Service
We use data to create and manage accounts, authenticate users, sync content, store history where applicable, and provide requested app functionality.

4.2. To operate AI features
We use submitted AI-related data to operate AI chat and related features, generate responses, analyze files or images submitted to AI features, and return the requested results to you.

4.3. To process files and images
If you upload files, images, or attachments to AI-enabled features, we may process those materials to fulfill the feature you selected.

4.4. To support subscriptions and billing
We use relevant data to manage subscriptions, entitlements, restore purchases, prevent billing abuse, and support payment-related workflows.

4.5. To maintain security and reliability
We use data to secure the Service, detect fraud or abuse, troubleshoot issues, monitor performance, enforce limits, maintain reliability, and protect users and the Service.

4.6. To improve the Service
Where permitted by law, we may use data, including AI-related usage information and limited diagnostics, to improve service quality, performance, safety, and user experience.

5. AI Features and Consent

5.1. Before any data is sent from the app to AI data processors, the app requests your permission through an in-app consent screen.

5.2. The in-app consent screen explains what data is sent, who receives it, and why it is sent.

5.3. If you use AI features, the following data may be sent for processing: your message text, prompts, extracted user preferences/facts to maintain chat context, uploaded files, uploaded images, attachments, language settings, and limited technical metadata required to process AI requests and deliver responses.

5.4. AI-related data may be sent to OtanAI servers and AI data processors, including Google Gemini, solely to provide the AI functionality you request.

5.5. The purpose of this transfer is to generate AI responses, process submitted files or images, and improve the Service where permitted by law.

5.6. If you decline consent, AI features remain unavailable. The app does not send AI requests to AI data processors unless you have granted consent.

5.7. Your consent choice is stored locally in the app and used to enforce whether AI requests may be sent.

5.8. AI-generated responses are produced automatically and may be incomplete, inaccurate, or inappropriate. They do not constitute medical, legal, financial, or other professional advice.

5.9. You should avoid submitting highly sensitive information unless strictly necessary. This includes identity documents, passwords, one-time codes, payment card details, medical records, and other highly confidential information.

5.10. Explicit Data Protection: We strictly DO NOT share your account details, including your name, email address, phone number, or authentication credentials, with Google Gemini or any other AI data processor. Only the specific context requested (such as message text or files) is transmitted.

5.11. Model Training: Google Gemini acts exclusively as a data processor. Google does not use your messages, prompts, context, or files to train their foundational AI models or to improve their products.

6. Sharing with Third Parties and Processors

6.1. We may share or transfer data with service providers and processors that support operation of the Service, including:

OtanAI servers, to receive, route, store, and process requests;

Firebase / Google, for authentication, database, cloud storage, and related infrastructure;

RevenueCat, for subscription, entitlement, and billing management;

Google Gemini, acting strictly as a data processor, when used to process AI-related content submitted through the Service;

other infrastructure or security providers, strictly as needed to operate, secure, monitor, or support the Service.

6.2. We do not sell your personal data to third parties for advertising or marketing purposes without your explicit consent.

6.3. AI data processors, including Google Gemini, process user data to provide AI functionality. We strictly require these processors to provide the same or an equal level of privacy and security protection for user data as stated in this Privacy Policy.

6.4. Processors may process data in accordance with their own legal obligations and service terms when acting as independent service providers, but we require appropriate contractual, technical, or organizational protections where applicable.

7. Storage and Protection

7.1. Data may be stored on servers and cloud infrastructure used by OtanAI and its providers, including systems located outside your country or region of residence.

7.2. We apply reasonable technical and organizational safeguards designed to protect personal data, including access controls, authentication controls, restricted permissions, encryption in transit where applicable, monitoring, and backups.

7.3. No method of transmission, storage, or processing is completely secure. We cannot guarantee absolute security.

8. Retention

8.1. We retain personal data for as long as reasonably necessary to provide the Service, comply with legal obligations, resolve disputes, enforce agreements, maintain records, or protect the Service.

8.2. AI-related content, account data, technical data, and subscription records may be retained for different periods depending on operational necessity, legal requirements, and user actions such as account deletion.

8.3. We may delete or anonymize data when it is no longer needed for the purposes described in this Policy, subject to legal or operational requirements.

9. Your Rights

9.1. Subject to applicable law, you may have the right to request access to your personal data, correction of inaccurate data, deletion of data, or restriction of certain processing.

9.2. You may withdraw consent for AI-related data sharing by changing your choice in the app where available. If you withdraw or decline consent, AI features will remain unavailable unless consent is granted again.

9.3. You may request account deletion where supported in the app or by contacting us at yeskendiriskakov@gmail.com.

10. Children

10.1. The Service is not intended for children under 18 years of age unless a different minimum age is required by applicable law or explicitly specified for a particular offering.

10.2. If we become aware that personal data has been collected from a child in violation of applicable law, we will take reasonable steps to delete it.

11. Contact

11.1. For privacy, data protection, or policy questions, contact: yeskendiriskakov@gmail.com.

12. Policy Changes

12.1. We may update this Policy from time to time to reflect changes in the Service, legal requirements, or our data practices.

12.2. The current version made available in the app or on the website will apply from its effective date.

12.3. Where required by law, we will provide additional notice of material changes.
`

function PrivacyPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const policyTextByLanguage = { kk: policyTextKk, ru: policyTextRu, en: policyTextEn }
  const policyText = policyTextByLanguage[language] || policyTextRu

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('privacyPolicy')}</h1>
        <div className="policy-toggle">
          {languages.map((item) => (
            <button
              key={item.code}
              className={`btn btn-ghost ${language === item.code ? 'is-active' : ''}`}
              type="button"
              onClick={() => setLanguage(item.code)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <article className="policy">
        {policyText.split('\n').map((line, index) => {
          if (line.startsWith('# ')) {
            return <h2 key={index}>{line.replace('# ', '')}</h2>
          }
          if (line.startsWith('## ')) {
            return <h3 key={index}>{line.replace('## ', '')}</h3>
          }
          if (line.trim() === '') {
            return <div key={index} className="policy-spacer" />
          }
          if (line.startsWith('- ')) {
            return (
              <div key={index} className="policy-bullet">
                <span className="policy-bullet-dot">•</span>
                <span>{line.replace('- ', '')}</span>
              </div>
            )
          }
          return (
            <p key={index} className="policy-paragraph">
              {line}
            </p>
          )
        })}
      </article>

      <div className="policy-actions">
        <a
          className="btn btn-ghost"
          href="https://otanai.kz/privacy"
          target="_blank"
          rel="noreferrer"
        >
          {t('openOnWebsite')}
        </a>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}
        >
          {t('backToChat')}
        </button>
      </div>
    </section>
  )
}

export default PrivacyPage
