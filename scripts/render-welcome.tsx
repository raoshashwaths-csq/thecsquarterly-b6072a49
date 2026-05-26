import { render } from '@react-email/components'
import React from 'react'
import { template } from '../src/lib/email-templates/vanguard-welcome'

const html = await render(React.createElement(template.component, { name: 'Sakthi' }))
process.stdout.write(html)
