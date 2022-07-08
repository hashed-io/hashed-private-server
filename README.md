# Hashed Private Server

Provides the backend services for Hashed Private solution:

- Enables the user to authenticate with the service by sigining a challenge message with the private key related to their on chain account
- Securly stores the user's private cipher key used to encrypt their owned payloads, this key is not the one related to their on chain account.
- Enables the lookup of other users public keys, to enable the sharing of data privately 
- Keeps track of each user's private data and related metadata
- Keeps track of data shares and related metadata

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
      public_key
      security_data
    }
  }
}
```

**Upsert Owned Data**

Inserts or updates an owned data record
```
mutation upsert_owned_data($id: Int, $name: String!, $description: String!, $cid: String!, $type: String!, $iv: String!, $mac: String! ){
  upsert_owned_data(req:{
    id: $id,
    name: $name,
    description: $description,
    cid: $cid,
    type: $type,
    iv: $iv,
    mac: $mac
  }){
    id
    name
    description
    cid
    type
    iv
    mac
    started_at
    ended_at
    is_deleted
  }
}
```

**Update Owned Data Metadata**

Updates the metadata related to an owned data record
```
mutation update_owned_data_metadata($id: Int!, $name: String!, $description: String!){
  update_owned_data_metadata(req:{
    id: $id,
    name:$name,
    description: $description
  }){
    affected_rows
  }
}
```


**Soft Delete Owned Data**

Soft deletes an owned data record
```
mutation soft_delete_owned_data($id: Int!){
  soft_delete_owned_data(req:{
    id: $id
  }){
    affected_rows
  }
}
```

**Share**

Inserts a shared data record
```
mutation share($toUserId: uuid!, $originalOwnedDataId: Int!, $cid: String!, $iv: String!, $mac: String! ){
  share(req:{
    to_user_id: $toUserId,
    original_owned_data_id:$originalOwnedDataId,
    cid: $cid,
    iv: $iv,
    mac: $mac
  }){
    id
    from_user{
      id
      address
    }
    to_user{
      id
      address
    }
    name
    description
    cid
    shared_at
    original_owned_data{
      id
      type
    }
    iv
    mac
  }
}
```

**Update Shared Data Metadata**

Updates the metadata related to an shared data record
```
mutation update_shared_data_metadata($id: Int!, $name: String!, $description: String!){
  update_shared_data_metadata(req:{
    id: $id,
    name:$name,
    description: $description
  }){
    affected_rows
  }
}
```



To run the hashed private server locally using the hashed private action server image:

`npm run start:all image`

To run the hashed private server locally by building the hashed private action server image from the current project dir:

`npm run start:all build`

The hashed private server services will be available at the following url:

`http://localhost:8080/v1/graphql`

