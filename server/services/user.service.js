var User = require('../models/user.model')
const Post = require('../models/post.model')
const fs = require('fs')
const path = require('path');
const { error } = require('console');
const { removeFile } = require('./post.service');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'do9w4fypf',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const calculateMutualFriends = (array1, array2) => {
    console.log("array1", array1);
    console.log("array2", array2);

    array1 = array1.map((item) => String(item))
    array2 = array2.map((item) => String(item))

    const set1 = new Set(array1);
    const set2 = new Set(array2);

    // Initialize a count for common elements
    let count = 0;

    // Iterate through the smaller set and check if each element exists in the other set
    const smallerSet = set1.size < set2.size ? set1 : set2;
    const largerSet = set1.size < set2.size ? set2 : set1;

    for (const element of smallerSet) {
        if (largerSet.has(element)) {
            count++;
        }
    }

    return count;
}

exports.getUserInfo = async function (email) {

    try {
        const userInfo = await User.find({ email: email }).select({ description: 1, location: 1, name: 1, profileImage: 1, coverImage: 1, _id: 0 })

        return {
            statusCode: 200, response: {
                success: true, data: userInfo[0], notification: {
                    value: false
                }
            }
        };

    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.addFriend = async function (email, freindId, add) {

    try {
        const user = await User.findOne({ email: email }).select({ friends: 1 });
        const friends = user.friends;

        const friendExist = await User.findById(freindId).select({ _id: 1 });
        // console.log(friendExist)
        if (!friendExist) return {
            statusCode: 400, response: {
                success: false, message: "UserId does not exist", notification: {
                    value: true,
                    message: "User does not exist for adding friend"
                }
            }
        };

        const len = friends.indexOf(freindId);

        if (add) {
            if (len < 0) {
                friends.unshift(freindId);
                await user.save();
                return {
                    statusCode: 200, response: {
                        success: true, message: "Friend added", data: friends, notification: {
                            value: true,
                            message: "Your friend is added"
                        }
                    }
                };
            } else {
                return {
                    statusCode: 200, response: {
                        success: true, message: "Already you are friend", notification: {
                            value: false
                        }
                    }
                };
            }
        }
        else {
            if (len >= 0) {
                const index = friends.indexOf(freindId);
                friends.splice(index, 1);
                await user.save();
                return {
                    statusCode: 200, response: {
                        success: true, message: "Friend removed", data: friends, notification: {
                            value: true,
                            message: "Your friend is removed"
                        }
                    }
                };
            } else {
                return {
                    statusCode: 200, response: {
                        success: true, message: "Already unfollowed", notification: {
                            value: false
                        }
                    }
                };
            }
        }

    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.getFriends = async function (email) {

    try {
        const user = await User.findOne({ email: email }).select({ friends: 1, name: 1, });
        let friends = user.friends;
        friends = await Promise.all(friends.map(async (id) => {
            const userFriend = await User.findById(id).select({ name: 1, profileImage: 1, friends: 1 });
            console.log("userA ", user.name, "userB", userFriend.name)
            console.log("userB Friends")
            return {
                name: userFriend.name,
                avatar: userFriend.profileImage,
                mutualFriends: calculateMutualFriends(user.friends, userFriend.friends)
            }
        }))
        // console.log("fridnss", user)
        return {
            statusCode: 200, response: {
                success: true, data: friends, notification: {
                    value: false,

                }
            }
        };
    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.getPhotos = async function (email) {

    try {
        const user = await User.findOne({ email: email });
        // console.log("user", user);
        let posts = await Post.find({ createdBy: user._id }).sort({ createdAt: -1 }).select({ images: 1, _id: 0 })
        let images = [];
        posts.map((post) => {
            images = images.concat(post.images)
        })
        return {
            statusCode: 200, response: {
                success: true, data: images, notification: {
                    value: false
                }
            }
        };
    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.updateProfileText = async function (email, location, name) {

    try {
        const user = await User.findOne({ email: email }).select({ location: 1, name: 1 });
        if (!user) return {
            statusCode: 400, response: {
                success: false, message: "User does not exist", notification: {
                    value: true,
                    message: "User does not exist updating profile"
                }
            }
        };

        user.location = location;
        user.name = name;
        await user.save();
        return {
            statusCode: 200, response: {
                success: true, message: "Profile is updated", notification: {
                    value: true,
                    message: "Profile is updated"
                }
            }
        };
    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.updateDescription = async function (email, description) {


    try {
        const user = await User.findOne({ email: email }).select({ description: 1 });
        if (!user) return {
            statusCode: 400, response: {
                success: false, message: "User does not exist", notification: {
                    value: true,
                    message: "User does not exist updating profile"
                }
            }
        };

        user.description = description;
        await user.save();
        return {
            statusCode: 200, response: {
                success: true, message: "About me is updated", notification: {
                    value: true,
                    message: "About me is updated"
                }
            }
        };
    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}

exports.updateProfileImage = async function (email, imageType, file) {

    try {
        const user = await User.findOne({ email: email }).select({ coverImage: 1, profileImage: 1 });

        if (!user) return {
            statusCode: 400, response: {
                success: false, message: "User does not exist", notification: {
                    value: true,
                    message: "User does not exist"
                }
            }
        };

        if (imageType === "cover") {

            const cover = await cloudinary.uploader.upload(path.join('./uploads/' + file[0].filename),
                { public_id: file[0].filename },
                (error, result) => {
                    removeFile(file[0].filename)
                    if (error)
                        console.log("Image upload error")
                })

            user.coverImage = cover.url


        }
        else if (imageType === "profile") {
            const profile = await cloudinary.uploader.upload(path.join('./uploads/' + file[0].filename),
                { public_id: file[0].filename },
                (error, result) => {
                    removeFile(file[0].filename)
                    if (error)
                        console.log("Image upload error")

                })

            user.profileImage = profile.url;
        }
        await user.save();


        return {
            statusCode: 200, response: {
                success: true, message: "Profile is updated", notification: {
                    value: true,
                    message: "Profile is updated"
                }
            }
        };
    } catch (e) {
        // Log Errors
        console.log("error", e)
    }
}
