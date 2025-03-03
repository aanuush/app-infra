import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Reference common-infra stack
const commonInfra = new pulumi.StackReference("anush/common-infra/dev");

// Fetch certificate and domain from common-infra
const certificateArn = commonInfra.getOutput("certificateArn");
const domainName = commonInfra.getOutput("domain");

// Create an S3 Bucket for hosting
const siteBucket = new aws.s3.Bucket("siteBucket", {
    website: { indexDocument: "index.html" }
});

// Upload an example index.html (Fix missing file in Step 2)
new aws.s3.BucketObject("index", {
    bucket: siteBucket,
    source: new pulumi.asset.FileAsset("index.html"),
    contentType: "text/html"
});

// Fix CloudFront Output Handling
const cloudfront = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [{
        domainName: siteBucket.bucketRegionalDomainName,  // ✅ Fix Output<T> issue
        originId: "s3Origin",
        s3OriginConfig: {
            originAccessIdentity: ""
        }
    }],
    defaultCacheBehavior: {
        targetOriginId: "s3Origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        }
    },
    viewerCertificate: {
        acmCertificateArn: certificateArn.apply(arn => arn), // ✅ Fix Output<T> issue
        sslSupportMethod: "sni-only"
    },
    restrictions: {   
        geoRestriction: {
            restrictionType: "none"
        }
    }
});

// Export CloudFront URL
export const cloudfrontUrl = pulumi.interpolate`${cloudfront.domainName}`; // ✅ Fix Output<T> issue
