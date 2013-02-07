  /**
   * OAuth config
   */
  
  Accounts.loginServiceConfiguration.remove({
    service: 'google'
  });

  Accounts.loginServiceConfiguration.remove({
    service: 'facebook'
  });

  Accounts.loginServiceConfiguration.insert({
    service: 'google',
    clientId: '325620456277.apps.googleusercontent.com',
    secret: 'xbqC4_-FbMPEsvbfzE_OpuF0'
  });

  Accounts.loginServiceConfiguration.insert({
    service: 'facebook',
    appId: '125234014318582',
    secret: 'a228e4a0c1b5bb82c9d7e8e6b2db9772'
  });


  Accounts.loginServiceConfiguration.remove({
    service: 'twitter'
  });

  Accounts.loginServiceConfiguration.insert({
    service: 'twitter', 
    consumerKey: 'uUtWbFK6DznnkUzi6qq7LA',
    secret: 'ZLHMeaT7wGfBHIN09U9QdtLBjcBJ5owOEVNFPy4qk0'
  });