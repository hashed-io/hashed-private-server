# Hashed Private Server

Provides the backend services for Hashed Private solution:

- Enables the user to authenticate with the service by signing a challenge message with the private key related to their on chain account
- Enables the creation and management of groups whose members have access to the same documents
- Securely stores the user's and group's private cipher key used to encrypt documents, this key is not the one related to their on chain account.
- Enables the lookup of other users and groups public keys, to enable the sharing of data privately 
- Keeps track of each user's and group's private data and related metadata
- Keeps track of document shares and related metadata

The services provided by this server are called via hasura actions and as such are exposed through the hasura graphql endpoint, some of the most important services are:

**Generate login challenge**

Generates a new challenge for the user trying to authenticate to sign
```
mutation generate_login_challenge($address: String!){
  generate_login_challenge(req:{
    address: $address
  }){
    message
  }
}
```

**Login**

Verifies the signed challenge and on success produces a JWT token
```
mutation login($address: String!, $signature: String!){
  login(req:{
    address: $address,
    signature: $signature
  }){
    refresh_token
    token	
    user{
      address
      id
      publicKey
      privateKey
    }
  }
}
```

**Find full actor data**

Retrieves data for the specified actor, including their private details
```
query find_full_actors($actorIds: [uuid!]!) {
    find_full_actors(req: {
      actorIds: $actorIds
    }){
      id
      address
      name
      publicKey
      privateKey
    }
  }
```

**Create Group**

Creates a group
```
mutation create_group($name: String!, $publicKey: String!, $securityData: String!) {
    create_group(req: 
      {
        name: $name,
        public_key: $publicKey,
        security_data: $securityData
      }
    ){
      id
    }
  }
```


To run the hashed private server locally using the hashed private action server image:

`npm run start:all image`

To run the hashed private server locally by building the hashed private action server image from the current project dir:

`npm run start:all build`

The hashed private server services will be available at the following url:

`http://localhost:8080/v1/graphql`

