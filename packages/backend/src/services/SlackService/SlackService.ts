import { analytics } from '../../analytics/client';
import { LightdashConfig } from '../../config/parseConfig';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { ShareModel } from '../../models/ShareModel';
import { SpaceModel } from '../../models/SpaceModel';

const puppeteer = require('puppeteer');

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const uuidRegex = new RegExp(uuid, 'g');
const nanoid = '[\\w-]{21}';
const nanoidRegex = new RegExp(nanoid);

type SlackServiceDependencies = {
    lightdashConfig: LightdashConfig;
    dashboardModel: DashboardModel;
    savedChartModel: SavedChartModel;
    spaceModel: SpaceModel;
    shareModel: ShareModel;
};

const notifySlackError = async (
    error: unknown,
    url: string,
    client: any,
    event: any,
): Promise<void> => {
    console.error(`Unable to unfurl url ${JSON.stringify(error)}`);

    const unfurls = {
        [url]: {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Unable to unfurl URL ${url}: ${error} `,
                    },
                },
            ],
        },
    };
    await client.chat
        .unfurl({
            ts: event.message_ts,
            channel: event.channel,
            unfurls,
        })
        .catch((er: any) =>
            console.error(`Unable to unfurl url ${JSON.stringify(er)}`),
        );
};

const uploadImage = async (
    screenshot: Buffer,
    client: any,
    event: any,
    context: any,
): Promise<string> => {
    // https://github.com/slackapi/node-slack-sdk/issues/1561
    const imageId = event.message_ts;

    const fileUpload = await client.files.upload({
        channels: event.channel,
        file: screenshot,
        filename: `dashboard-screenshot-${imageId}.png`,
        thread_ts: event.message_ts, // Upload on thread
    });

    const publicImage = await client.files.sharedPublicURL({
        file: fileUpload.file.id,
        token: context.userToken,
    });

    const permalink = publicImage?.file?.permalink_public;
    const permalinkParts = permalink.split('-');
    const pubSecret = permalinkParts[permalinkParts.length - 1];
    const imageUrl = `${publicImage?.file.url_private}?pub_secret=${pubSecret}`;
    return imageUrl;
};

const fetchDashboardScreenshot = async (urls: string): Promise<Buffer> => {
    let browser;

    const url =
        'http://lightdash-dev:3000/projects/3675b69e-8324-4110-bdca-059031aa8da3/dashboards/a972e221-f022-448c-8c14-14f89f9470c7/view';
    try {
        const browserWSEndpoint = `ws://${process.env.HEADLESS_BROWSER_HOST}:${process.env.HEADLESS_BROWSER_PORT}`;
        browser = await puppeteer.connect({
            browserWSEndpoint,
        });

        const page = await browser.newPage();
        const cookie =
            'rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX18uNUo3tdlPmNbDZgtywZSDg%2BlX%2B1oCGxnMd0qPgqbCQWY2wBm7r5ltdOdtIjnI%2Fa5TEafqijduBg%3D%3D; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yumUlxjrpd6DdP16xtaOG5ycLSkoaLKo%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2FPIUhDsxuZUeyGQIXCFp7fI%2BzGAvtN7Ro%3D; intercom-id-zppxyjpp=78f60bf4-1ef7-4ffb-ad37-94b82573e6ac; intercom-session-zppxyjpp=YlVWUzA5TXJnZWZtT3RoM0JJQlFLYjRQSUROZ0luNlg4QU5pOGlBSVpEbDg0M0JMSm5RYkd5eFlZbVZLc3EzUC0tMzR1UE9yNDhNNmhlS3dCd3BoejdyZz09--0507e0ac9828b9149fe52c614728dc2e94f987d1; rl_user_id=RudderEncrypt%3AU2FsdGVkX18%2BaQI5qSrAB6alFhkEzgfYftbcbs0iFPu6CINN4IDX7i0h%2F7suSoTo84%2BpX%2FoVSCcCDzZTfQSlnQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1885pSMbqtS3eGbN0yHjEuPvKCV%2BrsvuQs%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX19gaQH2MRUP32qQGk%2BsOJXUEPUPW0Y9p8E%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2BrrEFKPwf9rj6vir5TUxYzBfhl1IOQGYU%3D; remember_token_P5000=rephus|1666800205.726758|7cec7c860b67b34c8731ac3f327e0fee4366b0df46180fe931ed865d73ff436ef7864cb6b8acd9059bd509d34adfef77781ad2823f4f6399e88d508facd1df54; intercom-device-id-zppxyjpp=7a838067-0ef1-4353-937d-89be702cef02; amplitude_id=eyJkZXZpY2VJZCI6Ijg4NTU1YjFhLWIxMWUtNDAwZC1hNWMyLTc2YjllMzNjN2RkOSIsInVzZXJJZCI6bnVsbCwib3B0T3V0IjpmYWxzZX0=; _ga=GA1.1.2025871266.1669302165; connect.sid=s%3AvJJCUqbRzIXbinMg7vuZOgxIRtlY9leO.4w73M%2Bn9Nut22rc0E2b%2FJa4nFcJdAIRjEUo44qYDc4c';
        await page.setExtraHTTPHeaders({ cookie });

        await page.setViewport({
            width: 1024,
            height: 768, // hardcoded
        });
        const blockedUrls = [
            'headwayapp.co',
            'rudderlabs.com',
            'analytics.lightdash.com',
            'cohere.so',
            'intercom.io',
        ];
        await page.setRequestInterception(true);
        page.on('request', (request: any) => {
            const requestUrl = request.url();
            if (blockedUrls.includes(requestUrl)) {
                request.abort();
                return;
            }

            request.continue();
        });
        await page.goto(url, {
            timeout: 100000,
            waitUntil: 'networkidle0',
        });
        const path = `/tmp/${encodeURIComponent(url)}.png`;
        const imageBuffer = await page.screenshot({
            path,
            clip: { x: 0, y: 0, width: 1024, height: 768 },
        });

        return imageBuffer;
        // return path
    } catch (e) {
        console.error(`Unable to fetch screenshots from headless chromeo ${e}`);
        return e;
    } finally {
        if (browser) await browser.close();
    }
};

export class SlackService {
    lightdashConfig: LightdashConfig;

    dashboardModel: DashboardModel;

    savedChartModel: SavedChartModel;

    spaceModel: SpaceModel;

    shareModel: ShareModel;

    constructor({
        lightdashConfig,
        dashboardModel,
        savedChartModel,
        spaceModel,
        shareModel,
    }: SlackServiceDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.dashboardModel = dashboardModel;
        this.savedChartModel = savedChartModel;
        this.spaceModel = spaceModel;
        this.shareModel = shareModel;
    }

    private async unfurlChart(url: string, imageUrl: string): Promise<any> {
        const [projectUuid, chartUuid] = (await url.match(uuidRegex)) || [];

        const chart = this.savedChartModel.get(chartUuid);
        return {
            [url]: {
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: 'Chart unfurls not implemented',
                        },
                    },
                ],
            },
        };
    }

    private async unfurlDashboard(url: string, imageUrl: string): Promise<any> {
        const [projectUuid, dashboardUuid] = (await url.match(uuidRegex)) || [];

        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        // https://api.slack.com/reference/block-kit/blocks
        // https://app.slack.com/block-kit-builder/T0163M87MB9#%7B%22blocks%22:%5B%5D%7D
        const unfurls = {
            [url]: {
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: dashboard.name,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${dashboard.description || '-'}`,
                        },
                        accessory: {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Open in Lightdash',
                                emoji: true,
                            },
                            value: 'click_me_123',
                            url,
                            action_id: 'button-action',
                        },
                    },
                    {
                        type: 'image',
                        image_url: imageUrl,
                        alt_text: dashboard.name,
                    },
                ],
            },
        };
        return unfurls;
    }

    private async getSharedUrl(linkUrl: string): Promise<string> {
        return linkUrl;
        // We currently don't support charts or dashboards with shared URL, so we don't need this right now
        const [shareId] = linkUrl.match(nanoidRegex) || [];
        const shareUrl = await this.shareModel.getSharedUrl(shareId);
        return shareUrl.url || '';
    }

    private async parseUrl(
        linkUrl: string,
    ): Promise<{ isValid: boolean; isDashboard?: boolean; url: string }> {
        /* if (!linkUrl.startsWith(this.lightdashConfig.siteUrl)) {
            console.warn(
                `URL to unfurl ${linkUrl} does not belong to this siteUrl ${this.lightdashConfig.siteUrl}, ignoring.`,
            );
            return {
                isValid: false,
                url: linkUrl,
            };
        } */

        const shareUrl = new RegExp(`/share/${nanoid}`);
        const url = linkUrl.match(shareUrl)
            ? await this.getSharedUrl(linkUrl)
            : linkUrl;

        const dashboardUrl = new RegExp(`/projects/${uuid}/dashboards/${uuid}`);
        const chartUrl = new RegExp(`/projects/${uuid}/saved/${uuid}`);

        const isDashboard = url.match(dashboardUrl) !== null;
        const isChart = url.match(chartUrl) !== null;
        if (isDashboard || isChart) {
            return {
                isValid: true,
                isDashboard,
                url: linkUrl,
            };
        }
        console.warn(`URL to unfurl ${url} is not valid`);
        return {
            isValid: false,
            url,
        };
    }

    async unfurl(event: any, client: any, context: any): Promise<void> {
        event.links.map(async (l: any) => {
            const { url: linkUrl } = l;

            const { isValid, isDashboard, url } = await this.parseUrl(linkUrl);

            if (!isValid || isDashboard === undefined || url === undefined) {
                return;
            }

            analytics.track({
                event: 'share_slack.unfurl',
                userId: event.user,
                properties: {
                    isDashboard,
                },
            });

            try {
                const screenshot = await fetchDashboardScreenshot(url);

                const imageUrl = await uploadImage(
                    screenshot,
                    client,
                    event,
                    context,
                );

                const unfurls = await (isDashboard
                    ? this.unfurlDashboard(url, imageUrl)
                    : this.unfurlChart(url, imageUrl));
                client.chat
                    .unfurl({
                        ts: event.message_ts,
                        channel: event.channel,
                        unfurls,
                    })
                    .catch((e: any) => {
                        analytics.track({
                            event: 'share_slack.unfurl_error',
                            userId: event.user,
                            properties: {
                                error: `${e}`,
                            },
                        });
                        console.error(
                            `Unable to unfurl url ${url}: ${JSON.stringify(e)}`,
                        );
                    });
            } catch (e) {
                analytics.track({
                    event: 'share_slack.unfurl_error',
                    userId: event.user,

                    properties: {
                        error: `${e}`,
                    },
                });

                notifySlackError(e, url, client, event);
            }
        });
    }
}
