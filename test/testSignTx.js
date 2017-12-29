/********************************************************************************
*   Stellar Ledger API
*   (c) 2017 LeNonDupe
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
********************************************************************************/
var StellarSdk = require('stellar-sdk');
var fs = require('fs');

var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

var bip32Path = "44'/148'/0'";
var destination = "GBGBTCCP7WG2E5XFYLQFJP2DYOQZPCCDCHK62K6TZD4BHMNYI5WSXESH";

var timeout = 0;
var debug = true;

StellarSdk.Network.useTestNetwork();

/**
 * Sign a single payment transaction
 */
function runTest(comm, Api) {

    return comm.create_async(timeout, debug).then(function (comm) {
        var api = new Api(comm);
        return api.getPublicKey_async(bip32Path).then(function (result) {
            var publicKey = result['publicKey'];
            return loadAccount(publicKey).then(function (account) {
                // sign(api, publicKey, createAccountTx(account, publicKey));
                // sign(api, publicKey, paymentTx(account, publicKey));
                // sign(api, publicKey, pathPaymentTx(account, publicKey));
                // sign(api, publicKey, changeTrustTx(account, publicKey));
                // sign(api, publicKey, removeTrustTx(account, publicKey));
                // sign(api, publicKey, allowTrustTx(account, publicKey));
                // sign(api, publicKey, revokeTrustTx(account, publicKey));
                // sign(api, publicKey, createOfferTx(account, publicKey));
                // sign(api, publicKey, removeOfferTx(account, publicKey));
                // sign(api, publicKey, changeOfferTx(account, publicKey));
                sign(api, publicKey, setOptionsTx(account));
                // sign(api, publicKey, accountMergeTx(account));
                // sign(api, publicKey, manageDataTx(account));
                // sign(api, publicKey, inflationTx(account));
            });
        });
    });
}

function sign(api, publicKey, tx) {
  return api.signTx_async(bip32Path, tx).then(function (result) {
    var txHash = tx.hash();
    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
    if (keyPair.verify(txHash, result['signature'])) {
      console.log('Success! Good signature');
    } else {
      console.error('Failure: Bad signature');
    }
    // addSignatureToTransaction(publicKey, result['signature'], tx);
    // sendTransaction(tx);
  }).catch(function (err) {
    console.error(err);
  });

}

function loadAccount(publicKey) {
    return server.loadAccount(publicKey);
}

function createAccountTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.createAccount({
      destination: destination,
      startingBalance: "10"
    })).addMemo(StellarSdk.Memo.text("create new"))
    .build();
}

function paymentTx(account) {
    return new StellarSdk.TransactionBuilder(account)
        .addOperation(StellarSdk.Operation.payment({
            destination: destination,
            asset: StellarSdk.Asset.native(),
            amount: "10"
        })).addMemo(StellarSdk.Memo.text("sending starlight"))
        .build();
}

function pathPaymentTx(account, publicKey) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.pathPayment({
      destination: destination,
      sendAsset: new StellarSdk.Asset("USD", publicKey),
      sendMax: "50",
      destAsset: new StellarSdk.Asset("NGN", publicKey),
      destAmount: "18000"
    })).addMemo(StellarSdk.Memo.text("dollar to naira"))
    .build();
}

function createOfferTx(account, publicKey) {
  var buying = new StellarSdk.Asset("DUPE", publicKey);
  var selling = StellarSdk.Asset.native();
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.manageOffer({
      buying: buying,
      selling: selling,
      amount: "300",
      price: { n: 1, d: 3 }
    })).addMemo(StellarSdk.Memo.text("create offer"))
    .build();
}

function removeOfferTx(account, publicKey) {
  var buying = new StellarSdk.Asset("DUPE", publicKey);
  var selling = StellarSdk.Asset.native();
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.manageOffer({
      buying: buying,
      selling: selling,
      amount: "0",
      price: { n: 1, d: 3 },
      offerId: '2'
    }))
    .build();
}

function changeOfferTx(account, publicKey) {
  var buying = new StellarSdk.Asset("DUPE", publicKey);
  var selling = StellarSdk.Asset.native();
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.manageOffer({
      buying: buying,
      selling: selling,
      amount: "200",
      price: { n: 1, d: 3 },
      offerId: '2'
    }))
    .build();
}

function changeTrustTx(account, publicKey) {
  var asset = new StellarSdk.Asset("DUPE", publicKey);
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: asset
    }))
    .build();
}

function removeTrustTx(account, publicKey) {
  var asset = new StellarSdk.Asset("DUPE", publicKey);
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: '0'
    }))
    .build();
}

function allowTrustTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.allowTrust({
      trustor: destination,
      assetCode: "JPY",
      authorize: true
    })).addMemo(StellarSdk.Memo.text("allow trust"))
    .build();
}

function revokeTrustTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.allowTrust({
      trustor: destination,
      assetCode: "JPY",
      authorize: false
    })).addMemo(StellarSdk.Memo.text("revoke trust"))
    .build();
}

function setOptionsTx(account) {
  var opts = {};
  opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
  opts.clearFlags = StellarSdk.AuthRevocableFlag | StellarSdk.AuthImmutableFlag;
  opts.setFlags = StellarSdk.AuthRequiredFlag;
  opts.masterWeight = 0;
  opts.lowThreshold = 1;
  opts.medThreshold = 2;
  opts.highThreshold = 3;

  opts.signer = {
    ed25519PublicKey: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
    weight: 1
  };
  opts.homeDomain = "www.example.com";
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.setOptions(opts)).build();
}

function accountMergeTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.accountMerge({
      destination: destination
    })).addMemo(StellarSdk.Memo.text("merge account"))
    .build();
}

function manageDataTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.manageData({
      name: "name",
      value: "value"
    })).addMemo(StellarSdk.Memo.text("manage data"))
    .build();
}

function inflationTx(account) {
  return new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.inflation())
    .addMemo(StellarSdk.Memo.text("inflation"))
    .build();
}

function addSignatureToTransaction(publicKey, signature, transaction) {
    var keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
    var hint = keyPair.signatureHint();
    var decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: signature});
    transaction.signatures.push(decorated);
}

function sendTransaction(transaction) {
    server.submitTransaction(transaction)
        .then(function (transactionResult) {
            console.log(transactionResult);
        })
        .catch(function (err) {
            console.error(err);
        });
}

module.exports = runTest;
