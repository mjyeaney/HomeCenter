using System;
using System.Configuration;
using System.Diagnostics;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;

namespace HomeCenter.Agent
{
    static class Agent
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Starting up...");

            var sw = new Stopwatch();
            sw.Start();
            var connStr = ConfigurationManager.ConnectionStrings["StorageConnectionString"].ConnectionString;
            var account = CloudStorageAccount.Parse(connStr);
            var client = account.CreateCloudBlobClient();
            var dataContainer = client.GetContainerReference("data");

            var blobs = dataContainer.ListBlobs();

            foreach (var blob in blobs)
            {
                Console.WriteLine(((CloudBlockBlob)blob).Name);
            }

            sw.Stop();
            Console.WriteLine("Listed blobs in {0}ms", sw.ElapsedMilliseconds);
        }
    }
}

