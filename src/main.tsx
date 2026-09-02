import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { initAdapter } from './lib/data'
import './index.css'

const root = createRoot(document.getElementById('root') as HTMLElement)

// Data adapter dipilih sebelum render supaya komponen bisa memanggil getAdapter()
// secara sinkron tanpa memikirkan mode Firebase vs mock.
void initAdapter().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
