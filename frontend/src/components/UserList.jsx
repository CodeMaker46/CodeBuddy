import React from 'react';

const UserList = ({ users, typing }) => {
  console.log("Users in the list: ", users);
  console.log("Users typing: ", typing);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg w-full max-w-md mx-auto mt-8">
      <h3 className="text-xl font-bold">Users in the Room</h3>
      <ul className="mt-1">
        {users.map((user, index) => (
          <li key={index} className="flex justify-between items-center text-lg text-gray-300">
            <span>{user}</span> {/* Render user name directly */}
            <span
              className={`text-sm ${typing.includes(`${user}`) ? "text-green-400" : "text-gray-500"}`}
            >
              {typing.includes(`${user}`) ? "typing..." : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
