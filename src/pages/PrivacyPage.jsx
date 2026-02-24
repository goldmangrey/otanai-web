// Path: src/pages/PrivacyPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

const policyTextEn = `# OtanAI Privacy Policy

1. General Provisions

1.1. This Privacy Policy (hereinafter referred to as the "Policy") describes the data collected and processed when using the OtanAI application (hereinafter referred to as the "Service"), as well as the purposes and conditions of its processing.

1.2. The data controller is Goldman, an individual entrepreneur, located in Astana, Republic of Kazakhstan. For inquiries regarding this data, please contact: yeskendiriskakov@gmail.com. Website: https://otanai.kz.

1.3. By using the Service, the user confirms that they have read and agree to the Policy.

2. What data do we collect

2.1. Account data

We may collect data necessary for registration and sign-in: email address, name (if provided), phone number (if used), and Apple/Google sign-in data (identifier and basic information you have authorized to share).

2.2. Identifiers

We may process technical identifiers, such as Firebase UID, RevenueCat AppUserID, and device/app identifiers, required for authentication, subscriptions, and security.

2.3. User Content

The Service processes user content you send in chat: text messages, images, files, and other attachments. Such content may be stored in a database and/or cloud storage (e.g., Firestore/Storage) to ensure the functionality of the Service.

2.4. Technical Data

We may collect technical data necessary for stable operation and quality improvement: error logs, feature usage data, and performance information. If analytics is enabled, it is used in aggregate form and is not intended to directly identify you unless necessary.

3. How We Use Data

3.1. To provide the Service: account creation and management, storing conversation history, message processing, and data synchronization between devices.

3.2. To ensure quality and security: detect errors, prevent abuse, and improve performance.

3.3. To improve AI responses and functionality: Your messages and content may be processed to improve the quality of the service and models, if this is required by OtanAI's product logic and does not conflict with applicable law.

3.4. To process payments and subscriptions: Information required to manage subscriptions through the App Store/RevenueCat, including subscription status and technical identifiers.

4. AI Content and User Content

4.1. The user independently provides text, files, and images in the chat. This data may be processed using AI models to generate responses.

4.2. It is prohibited to send the following to the Service:

- Passport and other identification documents;
- Bank card details, passwords, and secret codes;
- Medical information, health information, or diagnosis information, unless specifically required by the service's operating mode;
- other sensitive data, the disclosure of which could cause harm.

4.3. AI responses are generated automatically and may be inaccurate. They do not constitute professional medical, legal, financial, or other advice.

5. Transfer of Data to Third Parties

5.1. We may transfer data to infrastructure and service providers necessary for the app to function:

- Firebase (Google) — authentication, database, storage;
- RevenueCat — subscription and billing management;
- other services that are used strictly as needed.

5.2. We do not sell personal data to third parties for marketing purposes without the user's explicit consent.

6. Data Storage and Protection

6.1. Data is stored on servers and in cloud infrastructure used by OtanAI and its providers (e.g., Google Cloud/Firebase). The storage geography may include countries outside your place of residence.

6.2. We implement reasonable technical and organizational security measures, including access control, encryption of data transmission, access rights restrictions, monitoring, and backup.

7. Data Retention Period

7.1. Data is retained for as long as necessary to provide the Service and fulfill obligations to the user, or until consent is revoked or the account is deleted, unless otherwise required by law.

8. User Rights

8.1. The user has the right to access their data and request correction or deletion.

8.2. Account deletion can be accessed through the app (if implemented) or by contacting support: yeskendiriskakov@gmail.com.

9. Children

9.1. The Service is not intended for persons under 18 years of age. The age limit may be changed depending on legal requirements and product settings.

10. Contacts

10.1. For questions regarding data processing, please contact yeskendiriskakov@gmail.com.

11. Policy Changes

11.1. We may update the Policy. The new version will take effect upon publication in the app and/or on the website: https://otanai.kz.
`

function PrivacyPage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')
  const policyText = language === 'ru' ? policyTextRu : policyTextEn

  return (
    <section className="page">
      <header className="page-header">
        <h1>Privacy Policy</h1>
        <div className="policy-toggle">
          <button
            className={`btn btn-ghost ${language === 'ru' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setLanguage('ru')}
          >
            Русский
          </button>
          <button
            className={`btn btn-ghost ${language === 'en' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setLanguage('en')}
          >
            English
          </button>
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
          Open on website
        </a>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}
        >
          Back to chat
        </button>
      </div>
    </section>
  )
}

export default PrivacyPage
