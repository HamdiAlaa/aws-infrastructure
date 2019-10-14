import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const _config = require('../config/aws_nodes.json');

var size: pulumi.Input<aws.ec2.InstanceType>;

export function getSize(){
    // It must be switch condition
    // To choose the Vm size, in type script the vmSize fave aws.ec2.instanceTypes as a type not a string like js

    if (_config.vmSize == 't2_micro') {size = aws.ec2.InstanceTypes.T2_Micro;}
    if (_config.vmSize == 't2_medium') {size = aws.ec2.InstanceTypes.T2_Medium};
    if (_config.vmSize == 't2_large') {size = aws.ec2.InstanceTypes.T2_Large;}
    if (_config.vmSize == 't2_xlarge') {size = aws.ec2.InstanceTypes.T2_XLarge;}
    return size;
}