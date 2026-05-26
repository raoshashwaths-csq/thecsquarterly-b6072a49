import { render } from '@react-email/components'
import React from 'react'
import { template } from '../src/lib/email-templates/vanguard-welcome'
const t = await render(React.createElement(template.component, { name: 'Sakthi' }), { plainText: true })
process.stdout.write(t)
