import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
setGlobalOptions({ region: process.env.FUNCTIONS_REGION ?? 'asia-southeast2', maxInstances: 10 })

export { onSubmissionCreated, onSubmissionDeleted } from './triggers/on-submission-write'
export { dailyReminder } from './scheduled/daily-reminder'
export { inviteAdmin, claimAdminInvite } from './callable/invite-admin'
