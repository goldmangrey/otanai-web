# Chat Message Actions QA

Manual checks for the chat message loading state and post-answer actions.

1. Send a prompt and observe the assistant loading state.
   - The text "OtanAI is thinking through your request" is not shown.
   - The loading state is not inside a large bordered card.
   - The visible status is only "Формирую ответ..." or the latest activity label from metadata.
   - The status is subtle, with a small dot and muted text.

2. Wait for an assistant answer.
   - There is no repeated "OTANAI" label above the answer.
   - Copy and regenerate controls appear under the answer content.
   - The controls are compact icon-style buttons, not large pills.
   - Copy still copies the answer text.
   - Regenerate still triggers a new response for the latest assistant answer.

3. Check rich response rendering.
   - Markdown formatting still renders.
   - Tables still render inside the table wrapper without horizontal page overflow.
   - Document previews still render for document-like fenced content.
   - Sources still render in the sources panel/drawer area.
   - Research activity timeline still renders on completed answers when metadata exists.

4. Check error and cancelled states.
   - Error text remains visible.
   - Retry and regenerate controls in error state remain usable.

5. Check mobile layout.
   - Message actions remain under the answer.
   - Buttons stay compact and do not stretch across the viewport.
   - There is no horizontal overflow.
