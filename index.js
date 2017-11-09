import snoowrap from 'snoowrap'
import credentials from './config/credentials'
import subreddits from './config/subreddits'

const r = new snoowrap({
    userAgent: credentials.userAgent,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    username: credentials.username,
    password: credentials.password
});

async function main() {        
    while(true) {
        for(let i = 0; i < subreddits.length; i++) {
            await formatAndLogComments(subreddits[i])              
            await sleep(2000)
        }
    }
}

function validComment(comment) {
    const validHtml = comment.body_html.includes('<a href="/r/')
    const eligibleBody = comment.body.split(' ')[0];
    const validBody = eligibleBody.match(/\/?r\/[A-Za-z]{3,}/g)

    return validHtml && validBody
}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function formatAndLogComments(subredditName) {
    r.getSubreddit(subredditName).getNewComments()
        .filter(comment => validComment(comment))
        .map((comment) => {
            return {
                id: comment.id,
                timestamp: comment.created,
                body: comment.body,
                html: comment.body_html,
                author: comment.author,
                upvotes: comment.ups 
            }
        }).then(console.log)   
}

main()
