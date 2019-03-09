import * as functions from "firebase-functions"
import { WebhookClient, Card } from "dialogflow-fulfillment"
import { Agent } from "https"
import fetch, { RequestInfo } from "node-fetch"

interface PixaResponse {
    webformatURL: string
    pageURL: string
    user: string
    tags: string
}

const fetchPixabay = (request: RequestInfo): Promise<PixaResponse[]> => {
    return new Promise((resolve, reject) => {
        fetch(request)
            .then(response => response.json())
            .then(body => resolve(body.hits))
            .catch(err => reject(err))
    })
}

const photoIntent = async agent => {
    const { query } = agent.parameters
    const pixabayURL = "https://pixabay.com/api/"
    const params = {
        q: query,
        key: functions.config().pixabay.key,
    }
    const queryString = Object.keys(params)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
        .join("&")
    console.log(`Calling URL: ${pixabayURL}?${queryString}`)

    const response = await fetchPixabay(`${pixabayURL}?${queryString}`)
    if (response.length === 0) {
        agent.add(`Could not find any images related to ${query}`)
        return
    }
    response
        .slice(0, response.length >= 3 ? 3 : response.length)
        .forEach(({ webformatURL, pageURL, user, tags }) => {
            console.log("Preview URL: ", webformatURL)
            agent.add(
                new Card({
                    title: `Posted by ${user}`,
                    text: tags,
                    imageUrl: webformatURL,
                    buttonText: "View on Pixabay",
                    buttonUrl: pageURL,
                })
            )
        })
}

export const helloWorld = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response })
    const intentMap = new Map()
    intentMap.set("PhotoCategoryIntent", photoIntent)
    agent.handleRequest(intentMap)
})
