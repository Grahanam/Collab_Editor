import React from 'react';
import Avatar from 'react-avatar';

const Client = ({username, isCurrentUser }) => {
    // console.log(username.username,isCurrentUser)
    return (
        <div className="client">
            <Avatar name={isCurrentUser? 'ME' : username.username} size={50} round="14px" />
            <span className="userName">{isCurrentUser? `Me(${username.username})` :<> {username.status?<span>{username.username}</span>:<span style={{textDecoration:'line-through',textDecorationColor:'red',textDecorationThickness:'2px'}}>{username.username}</span>}</>}</span>
        </div>
    );
};

export default Client;